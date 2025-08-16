const hre = require("hardhat");

async function main() {
  // Compile contracts
  await hre.run('compile');

  // Deploy StreamerNFT
  const StreamerNFT = await hre.ethers.getContractFactory("StreamerNFT");
  const streamerNFT = await StreamerNFT.deploy();

  await streamerNFT.deployed();

  console.log("StreamerNFT deployed to:", streamerNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
