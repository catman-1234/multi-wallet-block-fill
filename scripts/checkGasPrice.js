const { ethers } = require("ethers");
require("dotenv").config();

async function checkGasPrice() {
  try {
    // Connect to the provider using the RPC URL from your environment variables
    const provider = new ethers.JsonRpcProvider(
      process.env.WORLDMOBILE_BASE_TESTNET_RPC_URL
    );

    // Get the current gas price
    const gasPrice = await provider.getFeeData();

    // Convert gas price to different units
    const gasPriceInWMTx = ethers.formatUnits(gasPrice.gasPrice, "ether");
    const gasPriceInGwei = ethers.formatUnits(gasPrice.gasPrice, "gwei");

    console.log(`Gas Price in WMTx: ${gasPriceInWMTx}`);
    console.log(`Gas Price in WMTx Gwei: ${gasPriceInGwei}`);
    console.log(`Gas Price in WMTx Wei: ${gasPrice.gasPrice.toString()}`);
  } catch (error) {
    console.error("Error fetching gas price:", error);
  }
}

// Execute the function
checkGasPrice()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
