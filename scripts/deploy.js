const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying BlockMaxFiller contract...");

  const BlockMaxFiller = await hre.ethers.getContractFactory("BlockMaxFiller");
  const blockMaxFiller = await BlockMaxFiller.deploy();

  // Wait for deployment to complete
  await blockMaxFiller.waitForDeployment();

  const address = await blockMaxFiller.getAddress();
  console.log("BlockMaxFiller deployed to:", address);

  // Save the contract address to a file
  const deploymentInfo = {
    contractAddress: address,
    deploymentTimestamp: new Date().toISOString(),
    network: hre.network.name,
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
