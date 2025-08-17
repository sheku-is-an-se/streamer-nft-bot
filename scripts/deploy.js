import hre from "hardhat";

async function main() {
  console.log("Deploying StreamerNFT contract...");

  // Get the contract factory
  const StreamerNFT = await hre.ethers.getContractFactory("StreamerNFT");

  // Deploy the contract
  const streamerNFT = await StreamerNFT.deploy();

  // Wait for deployment to finish (ethers v5)
  await streamerNFT.deployed();

  console.log("StreamerNFT deployed at:", streamerNFT.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
