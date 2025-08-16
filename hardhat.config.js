require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL, // e.g., Infura/Alchemy
      accounts: [process.env.PRIVATE_KEY] // Your wallet private key
    }
  }
};
