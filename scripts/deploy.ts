import { ethers } from "hardhat";

async function main() {
  const Lotto = await ethers.getContractFactory("Lotto");
  const vrfCoordinatorAddress = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
  const subscriptionId = 777;
  const requestConfirmations = 5;
  const callbackGasLimit = 1000000;
  const keyHash =
    "0x7d2f9b7d7bfa22f8dfba858b341320a2f9b3bebe8b9b8979a9e3b5b5d8d5a1a1";
  const lotto = await Lotto.deploy(
    vrfCoordinatorAddress,
    subscriptionId,
    requestConfirmations,
    callbackGasLimit,
    keyHash
  );

  await lotto.deployed();

  console.log(`Lotto contract deployed to ${lotto.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
