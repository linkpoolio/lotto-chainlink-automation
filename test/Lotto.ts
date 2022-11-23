import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect, assert } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "./utils/helpers";

describe("Lotto", function () {
  let owner: any,
    vrfCoordinator: any,
    subscriptionId: any,
    requestConfirmations: any,
    callbackGasLimit: any,
    keyHash: any,
    vrfCoordinatorV2Mock: any,
    lotto: any;
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    keyHash =
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";
    callbackGasLimit = 100000;
    requestConfirmations = 3;
    vrfCoordinator = "0x3d2341ADb2D31f1c5530cDC622016af293177AE0";
    subscriptionId =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    vrfCoordinatorV2Mock = await ethers.getContractFactory(
      "VRFCoordinatorV2Mock"
    );
    lotto = await deploy("Lotto", [
      vrfCoordinator,
      subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      keyHash,
    ]);
  });

  describe("constructor", function () {
    it("sets requestConfig", async () => {
      const rc = await lotto.requestConfig();
      assert.equal(rc[4], keyHash);
    });
  });

  describe("User Actions", function () {
    it("Should revert for closed lotto", async function () {
      await expect(
        lotto.enterLotto({ numbers: [], requestId: 0 }, true)
      ).to.be.revertedWith("Lotto is not live");
    });
    it("Should enter lotto", async function () {
      const e = await lotto.enterLotto();
      expect(e.length).to.equal(0);
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
    // it("reverts if checkup is false", async () => {
    //   await expect(lotto.performUpkeep("0x")).to.be.revertedWith(
    //     "Lotto__UpkeepNotNeeded"
    //   );
    // });
    it("emits correct event on performUpkeep", async () => {
      await expect(lotto.performUpkeep("0x")).to.emit(lotto, "LottoClosed");
    });
  });

  describe("VRF", function () {
    it("can request random numbers", async () => {
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const tx = await lotto.performUpkeep("0x");
      assert(tx);
    });
    it("can recieve random numbers", async () => {
      await expect(lotto.performUpkeep("0x")).to.emit(lotto, "LottoClosed");
    });
  });
});
