import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL as string;

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      gas: 30000000,
      // forking: {
      //   url: MAINNET_RPC_URL,
      // },
    },
  },
};

export default config;
