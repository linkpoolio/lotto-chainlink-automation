import { ethers } from "hardhat";

async function main() {
  const Lotto = await ethers.getContractFactory("Lotto");
  const lotto = await Lotto.deploy();

  await lotto.deployed();

  console.log(`Lotto contract deployed to ${lotto.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
