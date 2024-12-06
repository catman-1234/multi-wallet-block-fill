/* This is a work in progress, not confident in the results yet */
const { ethers } = require("hardhat");
require("dotenv").config();

async function checkNetworkUtilization() {
  try {
    const provider = await ethers.provider;
    const latestBlockNumber = await provider.getBlockNumber();
    const blocksToAnalyze = 100;
    const startBlock = Math.max(0, latestBlockNumber - blocksToAnalyze + 1);

    console.log(`\nThis is a work in progress, not confident in the results yet`);
    console.log(`\nAnalyzing last ${blocksToAnalyze} finalized blocks...`);
    console.log("----------------------------------------");

    let stats = {
      totalTxs: 0,
      maxTxsInBlock: 0,
      totalGasUsed: 0n,
      maxGasUsed: 0n,
      blockTimes: [], // To track time between blocks
    };

    let previousBlockTimestamp = null;

    // Analyze each block
    for (let i = startBlock; i < startBlock + blocksToAnalyze; i++) {
      try {
        // Get only the finalized (post-reorg) block
        const block = await provider.getBlock(i, true);

        if (!block) {
          console.log(`Block #${i}: Unable to fetch block data - skipping`);
          continue;
        }

        // Update statistics
        stats.totalTxs += block.transactions.length;
        stats.maxTxsInBlock = Math.max(
          stats.maxTxsInBlock,
          block.transactions.length
        );
        stats.totalGasUsed += block.gasUsed;
        stats.maxGasUsed =
          block.gasUsed > stats.maxGasUsed ? block.gasUsed : stats.maxGasUsed;

        // Calculate block time
        if (previousBlockTimestamp) {
          const blockTime = Number(block.timestamp) - previousBlockTimestamp;
          stats.blockTimes.push(blockTime);
        }
        previousBlockTimestamp = Number(block.timestamp);

        // Log block details
        console.log(`\nBlock #${block.number}:`);
        console.log(`  Transactions: ${block.transactions.length}`);
        console.log(
          `  Gas Used: ${block.gasUsed.toString()} (${
            (block.gasUsed * 100n) / block.gasLimit
          }% of limit)`
        );
        console.log(`  Block Size: ${block.size || 0} bytes`);
      } catch (blockError) {
        console.log(`Error processing block #${i}: ${blockError.message}`);
        continue;
      }
    }

    // Calculate averages and metrics
    const avgTxsPerBlock = stats.totalTxs / blocksToAnalyze;
    const avgGasPerBlock = stats.totalGasUsed / BigInt(blocksToAnalyze);
    const avgBlockTime =
      stats.blockTimes.reduce((a, b) => a + b, 0) / stats.blockTimes.length;

    // Print load statistics
    console.log("\nNetwork Load Statistics (Finalized Blocks):");
    console.log("----------------------------------------");
    console.log(`Average Transactions per Block: ${avgTxsPerBlock.toFixed(2)}`);
    console.log(`Maximum Transactions in a Block: ${stats.maxTxsInBlock}`);
    console.log(`Average Gas Used per Block: ${avgGasPerBlock.toString()}`);
    console.log(`Maximum Gas Used in a Block: ${stats.maxGasUsed.toString()}`);
    console.log(`Average Block Time: ${avgBlockTime.toFixed(2)} seconds`);
    console.log(
      `Theoretical Max TPS: ${(stats.maxTxsInBlock / avgBlockTime).toFixed(2)}`
    );
    console.log(
      `Actual Average TPS: ${(avgTxsPerBlock / avgBlockTime).toFixed(2)}`
    );
  } catch (error) {
    console.error("Error analyzing network utilization:", error);
  }
}

// Execute the function
checkNetworkUtilization()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
