import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect, assert } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "./utils/helpers";

enum LottoState {
  staged,
  live,
  finished,
}

describe("Lotto", function () {
  let owner: any,
    subscriptionId: any,
    requestConfirmations: any,
    callbackGasLimit: any,
    keyHash: any,
    vrfCoordinatorV2Mock: any;
  let lotto: any;
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    const BASE_FEE = "2500000000";
    const GAS_PRICE_LINK = 1e9;
    keyHash =
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";
    callbackGasLimit = 10000000;
    requestConfirmations = 3;
    vrfCoordinatorV2Mock = await deploy("VRFCoordinatorV2Mock", [
      BASE_FEE,
      GAS_PRICE_LINK,
    ]);
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    let txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId.toNumber(),
      ethers.utils.parseEther("5")
    );
    lotto = await deploy("Lotto", [
      vrfCoordinatorV2Mock.address,
      subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      keyHash,
    ]);
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, lotto.address);
  });

  describe("constructor", function () {
    it("sets requestConfig", async () => {
      const rc = await lotto.requestConfig();
      assert.equal(rc[4], keyHash);
      assert.equal(rc[0], subscriptionId.toNumber());
    });
  });

  describe("User Actions", function () {
    it("Should revert for closed lotto", async function () {
      await expect(lotto.enterLotto([])).to.be.revertedWithCustomError(
        lotto,
        "LottoNotLive"
      );
    });
    it("Should revert, not enough numbers to enter", async function () {
      await expect(lotto.createLotto(100000, 10, false)).to.emit(
        lotto,
        "LottoCreated"
      );
      await expect(
        lotto.enterLotto([1, 1, 1, 1, 1], { value: 1000 })
      ).to.be.revertedWith("not enough numbers");
    });
    it("Should revert, numbers not lower than 100", async function () {
      await expect(lotto.createLotto(100000, 10, false)).to.emit(
        lotto,
        "LottoCreated"
      );
      await expect(
        lotto.enterLotto([1, 1, 1, 1, 1, 101], { value: 1000 })
      ).to.be.revertedWith("Number must be between 1 and 100");
    });
    it("Should enter with user picked numbers", async function () {
      await expect(lotto.createLotto(100000, 10, false)).to.emit(
        lotto,
        "LottoCreated"
      );
      await expect(
        lotto.enterLotto([1, 1, 1, 1, 1, 1], { value: 1000 })
      ).to.emit(lotto, "LottoEnter");
    });
  });

  describe("checkUpkeep", function () {
    it("returns false if lotto is not live", async () => {
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const { upkeepNeeded } = await lotto.callStatic.checkUpkeep("0x");
      assert(!upkeepNeeded);
    });
  });

  describe("performUpkeep", function () {
    it("can only run if checkupkeep is true", async () => {
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const tx = await lotto.performUpkeep("0x");
      assert(tx);
    });
    it("emits correct event on performUpkeep", async () => {
      await lotto.createLotto(100000, 10, false);
      await network.provider.send("evm_increaseTime", [100000000]);
      await network.provider.request({ method: "evm_mine", params: [] });
      await expect(lotto.performUpkeep("0x")).to.emit(lotto, "LottoStaged");
    });
  });

  describe("VRF", function () {
    it("can request random numbers", async () => {
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const tx = await lotto.performUpkeep("0x");
      assert(tx);
    });
    it("can create subscription", async () => {
      await expect(vrfCoordinatorV2Mock.createSubscription()).to.emit(
        vrfCoordinatorV2Mock,
        "SubscriptionCreated"
      );
    });
  });

  describe("fulfillRandomWords", function () {
    it("can only be called after performupkeep", async () => {
      await expect(
        vrfCoordinatorV2Mock.fulfillRandomWords(0, lotto.address) // reverts if not fulfilled
      ).to.be.revertedWith("nonexistent request");
      await expect(
        vrfCoordinatorV2Mock.fulfillRandomWords(1, lotto.address) // reverts if not fulfilled
      ).to.be.revertedWith("nonexistent request");
    });
    it("runs vrf after lotto is done with no winner", async () => {
      await lotto.createLotto(100000, 10, false);
      await lotto.enterLotto([4, 40, 34, 1, 20, 60], { value: 1000 });
      await network.provider.send("evm_increaseTime", [100000000]);
      await network.provider.request({ method: "evm_mine", params: [] });
      let tx = await lotto.performUpkeep("0x");
      await tx.wait(1);
      tx = await vrfCoordinatorV2Mock.fulfillRandomWords(1, lotto.address);
      await tx.wait(1);
      await expect(tx).to.emit(lotto, "WinningLotteryNumbers");
      const winners = await lotto.getWinners();
      assert(winners.length == 0);
      const state = (await lotto.lotto()).lottoState;
      assert(state == LottoState.live);
    });
    it("runs vrf after lotto is done with picking winners", async () => {
      await lotto.createLotto(100000, 10, false);
      await lotto.enterLotto([27, 28, 34, 75, 77, 94], { value: 1000 }); // winning numbers
      await network.provider.send("evm_increaseTime", [100000000]);
      await network.provider.request({ method: "evm_mine", params: [] });
      let tx = await lotto.performUpkeep("0x");
      await tx.wait(1);
      tx = await vrfCoordinatorV2Mock.fulfillRandomWords(1, lotto.address);
      await tx.wait(1);
      await expect(tx).to.emit(lotto, "WinningLotteryNumbers");
      const winners = await lotto.getWinners();
      assert(winners.length == 1);
      const state = (await lotto.lotto()).lottoState;
      assert(state == LottoState.finished);
    });
  });
});
