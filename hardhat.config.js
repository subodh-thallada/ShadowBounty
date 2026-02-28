require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

// Get private key from environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const MONAD_TESTNET_RPC_URL = process.env.MONAD_TESTNET_RPC_URL || "https://testnet-rpc.monad.xyz";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true  // Enable the IR pipeline to solve stack too deep errors
    }
  },
  networks: {
    // For local development
    hardhat: {
      chainId: 31337,
    },
    // Monad Testnet
    monad_testnet: {
      url: MONAD_TESTNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 10143,
    }
  },
  // Optional: If you want to verify your contract on Monad Explorer
  etherscan: {
    apiKey: {
      monadTestnet: ETHERSCAN_API_KEY
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet.monadexplorer.com/api",
          browserURL: "https://testnet.monadexplorer.com"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};