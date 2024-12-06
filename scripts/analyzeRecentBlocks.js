const { ethers } = require("hardhat");
require("dotenv").config();

async function getBlockDetails(provider, blockNumber) {
  try {
    const block = await provider.getBlock(blockNumber, true);
    if (!block) return null;

    const txDetails = [];
    // Get details for first 5 transactions as a sample
    for (let i = 0; i < Math.min(5, block.transactions.length); i++) {
      const tx = await provider.getTransaction(block.transactions[i]);
      if (tx) {
        txDetails.push({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          gasLimit: tx.gasLimit,
          gasPrice: tx.gasPrice,
          nonce: tx.nonce,
          data: tx.data,
        });
      }
    }

    return {
      number: block.number,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: block.timestamp,
      gasUsed: block.gasUsed,
      gasLimit: block.gasLimit,
      baseFeePerGas: block.baseFeePerGas || 0n,
      miner: block.miner,
      size: block.size || 0,
      txCount: block.transactions.length,
      transactions: txDetails,
    };
  } catch (error) {
    console.error(`Error getting block ${blockNumber}:`, error);
    return null;
  }
}

async function analyzeRecentBlocks() {
  try {
    const provider = await ethers.provider;
    const latestBlockNumber = await provider.getBlockNumber();
    const blocksToAnalyze = 50;
    const blocks = [];

    console.log(`\nAnalyzing Last ${blocksToAnalyze} Blocks`);
    console.log("========================================");

    // Collect block data
    for (let i = 0; i < blocksToAnalyze; i++) {
      const blockNumber = latestBlockNumber - i;
      const block = await getBlockDetails(provider, blockNumber);
      if (block) blocks.push(block);
    }

    // Calculate statistics
    const stats = {
      gasUsed: {
        values: blocks.map((b) => Number(b.gasUsed)),
        avg: 0,
        min: Infinity,
        max: 0,
      },
      gasLimit: {
        values: blocks.map((b) => Number(b.gasLimit)),
        avg: 0,
        min: Infinity,
        max: 0,
      },
      baseFeePerGas: {
        values: blocks.map((b) => Number(b.baseFeePerGas)),
        avg: 0,
        min: Infinity,
        max: 0,
      },
      blockSize: {
        values: blocks.map((b) => b.size),
        avg: 0,
        min: Infinity,
        max: 0,
      },
      txCount: {
        values: blocks.map((b) => b.txCount),
        avg: 0,
        min: Infinity,
        max: 0,
      },
      blockTime: {
        values: [],
        avg: 0,
        min: Infinity,
        max: 0,
      },
    };

    // Calculate block times
    for (let i = 0; i < blocks.length - 1; i++) {
      const blockTime = blocks[i].timestamp - blocks[i + 1].timestamp;
      stats.blockTime.values.push(blockTime);
    }

    // Calculate statistics for each metric
    for (const [key, metric] of Object.entries(stats)) {
      if (metric.values.length > 0) {
        metric.avg =
          metric.values.reduce((a, b) => a + b, 0) / metric.values.length;
        metric.min = Math.min(...metric.values);
        metric.max = Math.max(...metric.values);
      }
    }

    // Display individual block details
    blocks.forEach((block) => {
      console.log(`\nBlock #${block.number}:`);
      console.log(`  Hash: ${block.hash}`);
      console.log(
        `  Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`
      );
      console.log(
        `  Gas Used: ${block.gasUsed.toString()} (${(
          (Number(block.gasUsed) / Number(block.gasLimit)) *
          100
        ).toFixed(2)}%)`
      );
      console.log(`  Transactions: ${block.txCount}`);
      console.log(
        `  Base Fee: ${ethers.formatUnits(block.baseFeePerGas, "gwei")} gwei`
      );
    });

    // Display statistical analysis
    console.log("\nStatistical Analysis");
    console.log("========================================");

    console.log("\nGas Usage (in gas units):");
    console.log(`  Average: ${stats.gasUsed.avg.toFixed(0)}`);
    console.log(`  Minimum: ${stats.gasUsed.min.toFixed(0)}`);
    console.log(`  Maximum: ${stats.gasUsed.max.toFixed(0)}`);

    console.log("\nGas Utilization (%):");
    const avgUtilization = (stats.gasUsed.avg / stats.gasLimit.avg) * 100;
    const minUtilization = (stats.gasUsed.min / stats.gasLimit.max) * 100;
    const maxUtilization = (stats.gasUsed.max / stats.gasLimit.min) * 100;
    console.log(`  Average: ${avgUtilization.toFixed(2)}%`);
    console.log(`  Minimum: ${minUtilization.toFixed(2)}%`);
    console.log(`  Maximum: ${maxUtilization.toFixed(2)}%`);

    console.log("\nBase Fee (in wei):");
    console.log(`  Average: ${stats.baseFeePerGas.avg}`);
    console.log(`  Minimum: ${stats.baseFeePerGas.min}`);
    console.log(`  Maximum: ${stats.baseFeePerGas.max}`);

    console.log("\nTransactions per Block:");
    console.log(`  Average: ${stats.txCount.avg.toFixed(2)}`);
    console.log(`  Minimum: ${stats.txCount.min}`);
    console.log(`  Maximum: ${stats.txCount.max}`);

    console.log("\nBlock Time (seconds):");
    console.log(`  Average: ${stats.blockTime.avg.toFixed(2)}`);
    console.log(`  Minimum: ${stats.blockTime.min.toFixed(2)}`);
    console.log(`  Maximum: ${stats.blockTime.max.toFixed(2)}`);

    // Add network throughput calculation
    const avgTps = stats.txCount.avg / stats.blockTime.avg;
    console.log("\nNetwork Throughput:");
    console.log(`  Average TPS: ${avgTps.toFixed(2)}`);
    console.log(
      `  Peak TPS: ${(stats.txCount.max / stats.blockTime.min).toFixed(2)}`
    );
  } catch (error) {
    console.error("Error analyzing blocks:", error);
  }
}

// Execute the function
analyzeRecentBlocks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
