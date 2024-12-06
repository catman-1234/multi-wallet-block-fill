const { ethers } = require("hardhat");
require("dotenv").config();

async function analyzeLatestBlock() {
  try {
    const provider = await ethers.provider;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber, true);

    if (!block) {
      console.error("Could not fetch latest block");
      return;
    }

    console.log("\nLatest Block Analysis");
    console.log("========================================");

    // Block Properties
    console.log("\nBlock Properties:");
    console.log(`Block Number: ${block.number}`);
    console.log(`Block Hash: ${block.hash}`);
    console.log(`Parent Hash: ${block.parentHash}`);
    console.log(
      `Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`
    );
    console.log(`Gas Used: ${block.gasUsed.toString()}`);
    console.log(`Gas Limit: ${block.gasLimit.toString()}`);
    console.log(`Base Fee Per Gas: ${block.baseFeePerGas || 0} wei`);
    console.log(`Miner: ${block.miner}`);
    console.log(`Size: ${block.size || 0} bytes`);

    // Transaction Details
    if (block.transactions && block.transactions.length > 0) {
      console.log(`\nTransactions (${block.transactions.length} total):`);

      for (let i = 0; i < Math.min(5, block.transactions.length); i++) {
        const tx = await provider.getTransaction(block.transactions[i]);
        if (!tx) continue;

        console.log(`\nTransaction #${i + 1}:`);
        console.log(`  Hash: ${tx.hash}`);
        console.log(`  From: ${tx.from}`);
        console.log(`  To: ${tx.to}`);

        if (tx.value !== undefined && tx.value !== null) {
          console.log(`  Value: ${ethers.formatEther(tx.value)} WMTx`);
        }

        if (tx.gasLimit) {
          console.log(`  Gas Limit: ${tx.gasLimit.toString()}`);
        }

        if (tx.gasPrice) {
          console.log(
            `  Gas Price: ${ethers.formatUnits(tx.gasPrice, "gwei")} gwei`
          );
        }

        if (tx.nonce !== undefined) {
          console.log(`  Nonce: ${tx.nonce}`);
        }

        if (tx.data && tx.data !== "0x") {
          console.log(
            `  Data: ${tx.data.slice(0, 66)}${tx.data.length > 66 ? "..." : ""}`
          );
        }
      }

      if (block.transactions.length > 5) {
        console.log(
          `\n... and ${block.transactions.length - 5} more transactions`
        );
      }
    }
  } catch (error) {
    console.error("Error analyzing latest block:", error);
  }
}

// Execute the function
analyzeLatestBlock()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
