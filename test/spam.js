// Wallet spam transfers based on https://github.com/bnchk/wmc_testnet/blob/main/AUTO_TRANSACTIONS.md
const { ethers } = require("hardhat");
require("dotenv").config();

// Configurations
const RPC_URL = "https://rpc-testnet-base.worldmobile.net";
const TOKEN_CONTRACT_ADDRESS = "0x62435f7C97254f30D5D0Ec767563cB28399570a5"; //DAISY token, can replace with any other token
const TOKEN_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) public view returns (uint256)",
];

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Usage: yarn spam <number-of-wallets>");
  process.exit(1);
}

const NUM_WALLETS = parseInt(args[0]);
if (isNaN(NUM_WALLETS) || NUM_WALLETS < 2) {
  console.error("Please provide a valid number of wallets (minimum 2)");
  process.exit(1);
}

const MINIMUM_WALLET_BALANCE = 0.01;
const MINIMUM_TOKEN_BALANCE = ethers.parseUnits("2", 18);
const AMOUNT = ethers.parseUnits("0.1", 18);
const BATCH_SIZE = 10;

// Add these constants at the top
const BASE_GAS_LIMIT = 100000n;

// Add at the top with other constants
const MIN_SUCCESS_RATE = 0.7; // 70% success rate threshold
const MAX_SUCCESS_RATE = 0.9; // 90% success rate threshold
const GAS_INCREASE_FACTOR = 110n; // 10% increase (as BigInt)
const GAS_DECREASE_FACTOR = 95n; // 5% decrease (as BigInt)
const GAS_SCALE_FACTOR = 100n; // For percentage calculations
const MIN_GAS_PRICE_MULTIPLIER = 80n; // 80% of base (as BigInt)
const MAX_GAS_PRICE_MULTIPLIER = 200n; // 200% of base (as BigInt)

// Global gas tracking
const gasTracker = {
  currentMultiplier: 100n, // Start at 100% (as BigInt)
  successCount: 0,
  totalCount: 0,
  batchCount: 0,

  updateStats(successful, total) {
    this.successCount += successful;
    this.totalCount += total;
    this.batchCount++;

    const successRate = successful / total;

    if (successRate < MIN_SUCCESS_RATE) {
      this.increaseGas();
    } else if (successRate > MAX_SUCCESS_RATE) {
      this.decreaseGas();
    }

    console.log(`\nGas Stats:`);
    console.log(`Success Rate: ${(successRate * 100).toFixed(2)}%`);
    console.log(
      `Current Gas Multiplier: ${Number(this.currentMultiplier) / 100}x`
    );

    if (this.batchCount >= 5) {
      this.resetStats();
    }
  },

  increaseGas() {
    this.currentMultiplier =
      (this.currentMultiplier * GAS_INCREASE_FACTOR) / GAS_SCALE_FACTOR;
    if (this.currentMultiplier > MAX_GAS_PRICE_MULTIPLIER) {
      this.currentMultiplier = MAX_GAS_PRICE_MULTIPLIER;
    }
    console.log(
      `Increasing gas multiplier to ${Number(this.currentMultiplier) / 100}x`
    );
  },

  decreaseGas() {
    this.currentMultiplier =
      (this.currentMultiplier * GAS_DECREASE_FACTOR) / GAS_SCALE_FACTOR;
    if (this.currentMultiplier < MIN_GAS_PRICE_MULTIPLIER) {
      this.currentMultiplier = MIN_GAS_PRICE_MULTIPLIER;
    }
    console.log(
      `Decreasing gas multiplier to ${Number(this.currentMultiplier) / 100}x`
    );
  },

  resetStats() {
    this.successCount = 0;
    this.totalCount = 0;
    this.batchCount = 0;
    console.log("Resetting gas tracker stats");
  },

  getCurrentGasPrice(baseGasPrice) {
    return (baseGasPrice * this.currentMultiplier) / GAS_SCALE_FACTOR;
  },
};

// Function to collect wallet private keys from env
function getWallets() {
  const wallets = [];
  for (let i = 1; i <= NUM_WALLETS; i++) {
    const key = process.env[`WALLET_${i}_PRIVATE_KEY`];
    if (key) {
      wallets.push(key);
    }
  }
  return wallets;
}

// Function to initialize and fund a wallet
async function initializeWallet(
  privateKey,
  index,
  provider,
  fundingWallet,
  tokenContract
) {
  const wallet = new ethers.Wallet(privateKey, provider);

  // Check and fund native token balance
  const balance = await provider.getBalance(wallet.address);
  const balanceInWMTx = Number(ethers.formatEther(balance));
  console.log(`Wallet ${index + 1} balance:`, balanceInWMTx, "WMTx");

  if (balanceInWMTx < MINIMUM_WALLET_BALANCE) {
    const fundAmount =
      ethers.parseEther(MINIMUM_WALLET_BALANCE.toString()) - balance;
    console.log(`Funding Wallet ${index + 1} with native tokens...`);
    const fundTx = await fundingWallet.sendTransaction({
      to: wallet.address,
      value: fundAmount,
    });
    await fundTx.wait();
    console.log(
      `Wallet ${index + 1} funded with`,
      ethers.formatEther(fundAmount),
      "WMTx"
    );
  }

  // Check and fund token balance
  const tokenBalance = await tokenContract.balanceOf(wallet.address);
  console.log(
    `Wallet ${index + 1} token balance:`,
    ethers.formatUnits(tokenBalance, 18)
  );

  if (tokenBalance < MINIMUM_TOKEN_BALANCE) {
    const fundAmount = MINIMUM_TOKEN_BALANCE - tokenBalance;
    console.log(`Funding Wallet ${index + 1} with tokens...`);
    const fundTx = await tokenContract.transfer(wallet.address, fundAmount);
    await fundTx.wait();
    console.log(
      `Wallet ${index + 1} funded with`,
      ethers.formatUnits(fundAmount, 18),
      "tokens"
    );
  }

  console.log(`Wallet ${index + 1} ready:`, wallet.address);
  return wallet;
}

// Function to send tokens from one wallet to another
async function sendTokens(fromWallet, toAddress, provider, nonce) {
  const tokenContract = new ethers.Contract(
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_ABI,
    fromWallet
  );

  try {
    // Get base gas price and apply multiplier
    const feeData = await provider.getFeeData();
    const baseGasPrice = feeData.gasPrice;
    const gasPrice = gasTracker.getCurrentGasPrice(baseGasPrice);

    // Get current gas limit estimate
    const gasEstimate = await tokenContract.transfer.estimateGas(
      toAddress,
      AMOUNT
    );
    console.log(`Gas estimate: ${gasEstimate}`);
    const gasLimit =
      gasEstimate > BASE_GAS_LIMIT ? gasEstimate : BASE_GAS_LIMIT;

    console.log(`Sending from ${fromWallet.address} to ${toAddress}...`);
    const tx = await tokenContract.transfer(toAddress, AMOUNT, {
      gasLimit: Number(gasLimit),
      gasPrice: Number(gasPrice),
      nonce,
    });
    console.log(`Transaction sent: ${tx.hash}`);
    return tx;
  } catch (err) {
    if (
      err.message.includes("insufficient funds") ||
      err.message.includes("gas required exceeds") ||
      err.message.includes("underpriced")
    ) {
      console.log(`Gas error detected, will increase for next batch`);
    }
    console.error(
      `Error sending transaction:`,
      err.shortMessage || err.message
    );
    return null;
  }
}

// Main function
async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const [fundingWallet] = await ethers.getSigners();
  const tokenContract = new ethers.Contract(
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_ABI,
    fundingWallet
  );

  const privateKeys = getWallets();
  if (privateKeys.length < 2) {
    console.error("Need at least 2 wallets to perform transfers");
    process.exit(1);
  }

  console.log(`Found ${privateKeys.length} wallets`);

  // Initialize and fund all wallets
  console.log("\nInitializing and funding wallets...");
  const wallets = [];
  for (let i = 0; i < privateKeys.length; i++) {
    const wallet = await initializeWallet(
      privateKeys[i],
      i,
      provider,
      fundingWallet,
      tokenContract
    );
    wallets.push(wallet);
  }

  while (true) {
    console.log("\nStarting new batch...");

    // Create pairs for transfers (round-robin)
    const pendingTxs = [];

    for (let i = 0; i < wallets.length; i++) {
      const fromWallet = wallets[i];
      const toWallet = wallets[(i + 1) % wallets.length]; // Round-robin to next wallet

      const nonce = await provider.getTransactionCount(fromWallet.address);

      // Send multiple transactions per wallet in each batch
      for (let j = 0; j < BATCH_SIZE; j++) {
        const tx = sendTokens(
          fromWallet,
          toWallet.address,
          provider,
          nonce + j
        );
        pendingTxs.push(tx);
      }
    }

    // Wait for all transactions in the batch
    const results = await Promise.all(pendingTxs);
    const successful = results.filter((tx) => tx !== null).length;
    console.log(
      `Batch completed. ${successful}/${pendingTxs.length} transactions sent successfully.`
    );

    // Add this line to enable gas price adjustments:
    gasTracker.updateStats(successful, pendingTxs.length);

    // Optional delay between batches
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Run the script
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
