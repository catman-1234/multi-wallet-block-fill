require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const fundingWalletPrivateKey = process.env.FUNDING_WALLET_PRIVATE_KEY ?? "";

module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    worldmobileBase: {
      url: process.env.WORLDMOBILE_BASE_TESTNET_RPC_URL || "",
      accounts: [fundingWalletPrivateKey],
    },
  },
  defaultNetwork: "worldmobileBase",
};
