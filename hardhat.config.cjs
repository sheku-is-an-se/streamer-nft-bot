require("dotenv").config();
require("@nomiclabs/hardhat-ethers");

module.exports = {
	solidity: "0.8.20",
	networks: {
		sepolia: {
			url: process.env.SEPOLIA_RPC_URL,
			accounts: [process.env.PRIVATE_KEY],
		},
	},
	paths: {
		artifacts: "./artifacts",
	},
};
