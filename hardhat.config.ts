import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-abi-exporter";

require("dotenv").config();

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL as string;
const GOERLI_RPC_URL = process.env.MAINNET_RPC_URL as string;
const BINANCE_MAINNET_RPC_URL = process.env.BINANCE_MAINNET_RPC_URL as string;
const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL as string;
const LOCAL_RPC_URL = process.env.RPC_URL as string;
const PRIVATE_KEY = (process.env.PRIVATE_KEY as string) || "0x";

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
    // ganache: {
    //   url: LOCAL_RPC_URL,
    // },
    hardhat: {
      gas: 30000000,
      // forking: {
      //   url: MAINNET_RPC_URL,
      // },
    },
    // mainnet: {
    //   url: MAINNET_RPC_URL,
    //   accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    //   chainId: 1,
    // },
    // goerli: {
    //   url: GOERLI_RPC_URL,
    //   accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    //   chainId: 5,
    // },
    // polygon: {
    //   url: POLYGON_MAINNET_RPC_URL,
    //   accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    //   chainId: 137,
    // },
    // binance: {
    //   url: BINANCE_MAINNET_RPC_URL,
    //   accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    //   chainId: 56,
    // },
  },
};

export default config;
