import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Deploying StreamerNFT contract...");

  // Get the contract factory
  const StreamerNFT = await hre.ethers.getContractFactory("StreamerNFT");

  // Deploy the contract (no external registry needed for MinimalTBA)
  const streamerNFT = await StreamerNFT.deploy();

  // Wait for deployment to finish (ethers v5)
  await streamerNFT.deployed();

  console.log("StreamerNFT deployed at:", streamerNFT.address);

  // Write unified frontend artifact: abi + address
  const artifact = hre.artifacts.readArtifactSync("StreamerNFT");
  const outPath = path.join(process.cwd(), "frontend", "StreamerNFT.json");
  const payload = {
    abi: artifact.abi,
    address: streamerNFT.address,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log("Wrote frontend artifact:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
