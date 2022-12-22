export const networkConfig: { [key: number]: any } = {
  31337: {
    name: "hardhat",
    vrfCoordinatorV2: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    keepersRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    subscriptionId: 1, // add subscription id
    requestConfirmations: 3,
    callbackGasLimit: 10000000,
    keyHash:
      "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef", // 200 gwei
  },
  1: {
    name: "mainnet",
    vrfCoordinatorV2: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    keepersRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    subscriptionId: 1, // add subscription id
    requestConfirmations: 3,
    callbackGasLimit: 10000000,
    keyHash:
      "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef", // 200 gwei
  },
  5: {
    name: "goerli",
    vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    keepersRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    subscriptionId: 1, // add subscription id
    requestConfirmations: 3,
    callbackGasLimit: 10000000,
    keyHash:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 150 gwei
  },
  56: {
    name: "binance",
    vrfCoordinatorV2: "0xc587d9053cd1118f25F645F9E08BB98c9712A4EE",
    keepersRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    subscriptionId: 1, // add subscription id
    requestConfirmations: 3,
    callbackGasLimit: 10000000,
    keyHash:
      "0x114f3da0a805b6a67d6e9cd2ec746f7028f1b7376365af575cfea3550dd1aa04", // 200 gwei
  },
  137: {
    name: "polygon",
    vrfCoordinatorV2: "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
    keepersRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    subscriptionId: 1, // add subscription id
    requestConfirmations: 3,
    callbackGasLimit: 10000000,
    keyHash:
      "0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93", // 200 gwei
  },
};
