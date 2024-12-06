/* This is a work in progress, not confident in the results yet */
const { ethers } = require("hardhat");
require("dotenv").config();

async function calculateBlockFees(block) {
  try {
    let totalFees = 0n;
    for (const tx of block.transactions) {
      if (typeof tx === "string") {
        const fullTx = await ethers.provider.getTransaction(tx);
        if (fullTx) {
          const gasUsed = BigInt(fullTx.gasLimit);
          const gasPrice = BigInt(fullTx.gasPrice);
          totalFees += gasUsed * gasPrice;
        }
      } else {
        const gasUsed = BigInt(tx.gasLimit || tx.gas || 0);
        const gasPrice = BigInt(tx.gasPrice || 0);
        totalFees += gasUsed * gasPrice;
      }
    }
    return totalFees;
  } catch (error) {
    console.warn(
      `Warning: Error calculating fees for block ${block.number}: ${error.message}`
    );
    return 0n;
  }
}

async function analyzeNetwork() {
  try {
    const provider = await ethers.provider;
    const latestBlockNumber = await provider.getBlockNumber();
    const blocksToAnalyze = 100;
    const startBlock = Math.max(0, latestBlockNumber - blocksToAnalyze + 1);

    console.log(
      `\nThis is a work in progress, not confident in the results yet`
    );
    console.log(`\nAnalyzing blocks ${startBlock} to ${latestBlockNumber}`);
    console.log("========================================");

    let stats = {
      totalBlocks: 0,
      totalTxs: 0,
      totalGasUsed: 0n,
      maxTxCount: 0,
      maxTxBlock: 0,
      maxGasUsed: 0n,
      maxGasBlock: 0,
      minGasUsed: BigInt(Number.MAX_SAFE_INTEGER),
      minGasBlock: 0,
      maxUtilization: 0,
      maxUtilBlock: 0,
      totalFees: 0n,
      maxBlockFee: 0n,
      maxFeeBlockNumber: 0,
      blockTimes: [],
      reorgCount: 0,
    };

    let previousBlock = null;

    for (let i = startBlock; i <= latestBlockNumber; i++) {
      try {
        const block = await provider.getBlock(i, true);
        if (!block) continue;

        stats.totalBlocks++;

        // Calculate block time
        if (previousBlock) {
          const blockTime = block.timestamp - previousBlock.timestamp;
          stats.blockTimes.push(blockTime);
        }

        // Calculate utilization
        const gasUsed = block.gasUsed;
        const gasLimit = block.gasLimit;
        const utilization = (Number(gasUsed) * 100) / Number(gasLimit);
        const blockFee = await calculateBlockFees(block);

        console.log(`\nBlock #${i} (Regular):`);
        console.log(`  Transactions: ${block.transactions.length}`);
        console.log(
          `  Gas Used: ${gasUsed.toString()} (${utilization.toFixed(
            2
          )}% of limit)`
        );
        console.log(`  Block Size: ${block.size || 608} bytes`);
        console.log(`  Fees: ${ethers.formatEther(blockFee)} WMTx`);

        // Update statistics
        stats.totalTxs += block.transactions.length;
        stats.totalGasUsed += gasUsed;
        stats.totalFees += blockFee;

        if (block.transactions.length > stats.maxTxCount) {
          stats.maxTxCount = block.transactions.length;
          stats.maxTxBlock = i;
        }
        if (gasUsed > stats.maxGasUsed) {
          stats.maxGasUsed = gasUsed;
          stats.maxGasBlock = i;
        }
        if (gasUsed < stats.minGasUsed) {
          stats.minGasUsed = gasUsed;
          stats.minGasBlock = i;
        }
        if (utilization > stats.maxUtilization) {
          stats.maxUtilization = utilization;
          stats.maxUtilBlock = i;
        }
        if (blockFee > stats.maxBlockFee) {
          stats.maxBlockFee = blockFee;
          stats.maxFeeBlockNumber = i;
        }

        previousBlock = block;
      } catch (error) {
        console.error(`Error processing block ${i}:`, error);
      }
    }

    printNetworkStatistics(stats);
  } catch (error) {
    console.error("Error analyzing network:", error);
  }
}

function printNetworkStatistics(stats) {
  const avgBlockTime =
    stats.blockTimes.length > 0
      ? stats.blockTimes.reduce((a, b) => a + b, 0) / stats.blockTimes.length
      : 0;

  console.log("\nNetwork Analysis Summary");
  console.log("========================================");

  console.log("\nBlock Production:");
  console.log(`Total Blocks Analyzed: ${stats.totalBlocks}`);
  console.log(`Average Block Time: ${avgBlockTime.toFixed(2)} seconds`);

  console.log("\nTransactions:");
  console.log(`Total Transactions: ${stats.totalTxs}`);
  console.log(
    `Average Transactions per Block: ${(
      stats.totalTxs / stats.totalBlocks
    ).toFixed(2)}`
  );
  console.log(
    `Maximum Transactions: ${stats.maxTxCount} (Block #${stats.maxTxBlock})`
  );
  console.log(
    `Actual Average TPS: ${(
      stats.totalTxs /
      (avgBlockTime * stats.totalBlocks)
    ).toFixed(2)}`
  );

  console.log("\nGas Usage:");
  console.log(
    `Average Gas per Block: ${(
      Number(stats.totalGasUsed) / stats.totalBlocks
    ).toFixed(0)}`
  );
  console.log(
    `Maximum Gas Used: ${stats.maxGasUsed.toString()} (Block #${
      stats.maxGasBlock
    })`
  );
  console.log(
    `Minimum Gas Used: ${stats.minGasUsed.toString()} (Block #${
      stats.minGasBlock
    })`
  );
  console.log(
    `Highest Utilization: ${stats.maxUtilization.toFixed(2)}% (Block #${
      stats.maxUtilBlock
    })`
  );

  console.log("\nFees:");
  console.log(`Total Fees: ${ethers.formatEther(stats.totalFees)} WMTx`);
  console.log(
    `Highest Block Fee: ${ethers.formatEther(stats.maxBlockFee)} WMTx (Block #${
      stats.maxFeeBlockNumber
    })`
  );
  console.log(
    `Average Block Fee: ${ethers.formatEther(
      stats.totalFees / BigInt(stats.totalBlocks)
    )} WMTx`
  );
}

// Execute the function
analyzeNetwork()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
