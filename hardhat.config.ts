import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-abi-exporter";

require("dotenv").config();

const MAINNET_RPC_URL = process.env.RPC_URL as string;
const GOERLI_RPC_URL = process.env.RPC_URL as string;
const GANACHE_RPC_URL = process.env.RPC_URL as string;

interface Config extends HardhatUserConfig {
  abiExporter: {
    path: string;
    runOnCompile: boolean;
    format: string;
  };
}

const config: Config = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  abiExporter: {
    path: "./packages/sdk/src/abi",
    runOnCompile: true,
    format: "json",
  },
  networks: {
    ganache: {
      url: GANACHE_RPC_URL,
    },
    hardhat: {
      gas: 30000000,
      // forking: {
      //   url: MAINNET_RPC_URL,
      // },
    },
  },
};

export default config;
