require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const provider = await ethers.provider;

  console.log("\nFunding Wallet:");
  console.log("--------------");

  // Check funding wallet first
  try {
    const fundingPrivateKey = process.env.FUNDING_WALLET_PRIVATE_KEY;
    if (fundingPrivateKey) {
      const fundingWallet = new ethers.Wallet(fundingPrivateKey, provider);
      const balance = await provider.getBalance(fundingWallet.address);
      console.log(`Address: ${fundingWallet.address}`);
      console.log(`Balance: ${ethers.formatEther(balance)} WMTx`);
    } else {
      console.log("No funding wallet private key found in .env");
    }
  } catch (error) {
    console.log("Error checking funding wallet:", error.message);
  }

  // Get all environment variables that match WALLET_*_PRIVATE_KEY pattern
  const walletEnvVars = Object.keys(process.env)
    .filter((key) => key.match(/^WALLET_\d+_PRIVATE_KEY$/))
    .sort((a, b) => {
      // Sort by wallet number
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

  console.log("\nTest Wallet Balances:");
  console.log("--------------------");

  let totalTestBalance = ethers.parseEther("0");

  for (const envVar of walletEnvVars) {
    try {
      const privateKey = process.env[envVar];
      const wallet = new ethers.Wallet(privateKey, provider);
      const balance = await provider.getBalance(wallet.address);
      totalTestBalance += balance;

      console.log(`\nWallet ${envVar.match(/\d+/)[0]}:`);
      console.log(`Address: ${wallet.address}`);
      console.log(`Balance: ${ethers.formatEther(balance)} WMTx`);
    } catch (error) {
      console.log(`\nError checking ${envVar}:`, error.message);
    }
  }

  console.log("\n--------------------");
  console.log(
    `Total Balance Across Test Wallets: ${ethers.formatEther(
      totalTestBalance
    )} WMTx`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
