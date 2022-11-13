import { ethers } from "hardhat";

export const deploy = async (contractName: string, args: any[] = []) => {
  const Contract = await ethers.getContractFactory(contractName);
  return Contract.deploy(...args);
};
