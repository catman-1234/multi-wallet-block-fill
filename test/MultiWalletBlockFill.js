require("dotenv").config();
const { ethers } = require("hardhat");

describe("Multi Wallet Block Fill Test", function () {
  // Set timeout to 1 hour
  this.timeout(60 * 60 * 1000);

  // Configuration
  const CONTRACT_ADDRESS = "0x8bE7A35e29048072194a64b2EaA6a3AbE1eAff67";
  const MINIMUM_WALLET_BALANCE = 0.1;
  const BLOCKS_TO_FILL = 100;

  // Test state
  let provider;
  let deployer;
  let walletConnectedContracts;
  let startBlock;

  async function initializeWallet(privateKey, index) {
    const wallet = new ethers.Wallet(privateKey, provider);

    // Check and fund wallet
    const balance = await provider.getBalance(wallet.address);
    const balanceInWMTx = Number(ethers.formatEther(balance));
    console.log(`Wallet ${index + 1} balance:`, balanceInWMTx, "WMTx");

    if (balanceInWMTx < MINIMUM_WALLET_BALANCE) {
      const fundAmount =
        ethers.parseEther(MINIMUM_WALLET_BALANCE.toString()) - balance;
      console.log(`Funding Wallet ${index + 1}...`);
      const fundTx = await deployer.sendTransaction({
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

    // Connect wallet to contract
    const blockMaxFiller = await ethers.getContractAt(
      "IBlockMaxFiller",
      CONTRACT_ADDRESS
    );
    const contractWithSigner = blockMaxFiller.connect(wallet);
    console.log(`Wallet ${index + 1} ready:`, wallet.address);

    return contractWithSigner;
  }

  async function sendBlockFillTransaction(contract, walletIndex) {
    try {
      console.log(`Wallet ${walletIndex + 1} clearing storage...`);
      await contract.clearStorage();

      const tx = await contract.fillBlock();
      console.log(`Wallet ${walletIndex + 1} transaction sent:`, tx.hash);

      const receipt = await tx.wait();
      console.log(`\nWallet ${walletIndex + 1} Results:`, {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status,
        transactionHash: receipt.hash,
      });

      return receipt;
    } catch (error) {
      logError(error, walletIndex);
      return null;
    }
  }

  function logError(error, walletIndex) {
    console.log(`\nWallet ${walletIndex + 1} Failed!`);
    console.log("Error type:", error.constructor.name);
    console.log("Error message:", error.message);

    if (error.transaction) {
      console.log("Transaction details:", {
        from: error.transaction.from,
        to: error.transaction.to,
        gasLimit: error.transaction.gasLimit?.toString(),
        nonce: error.transaction.nonce,
      });
    }

    if (error.receipt) {
      console.log("Error Receipt:", {
        blockNumber: error.receipt.blockNumber,
        gasUsed: error.receipt.gasUsed.toString(),
        status: error.receipt.status,
      });
    }
  }

  function printStatistics(
    startBlock,
    endBlock,
    successCount,
    failCount,
    totalWallets
  ) {
    console.log("\nFinal Statistics:");
    console.log("-----------------");
    console.log("Starting Block:", startBlock.number);
    console.log("Ending Block:", endBlock.number);
    console.log("Blocks Processed:", endBlock.number - startBlock.number);
    console.log("Total Transaction Attempts:", BLOCKS_TO_FILL * totalWallets);
    console.log("Successful Transactions:", successCount);
    console.log("Failed Transactions:", failCount);
    console.log(
      "Success Rate:",
      ((successCount / (BLOCKS_TO_FILL * totalWallets)) * 100).toFixed(2) + "%"
    );
  }

  it("Should fill blocks from multiple wallets simultaneously", async function () {
    provider = await ethers.provider;
    [deployer] = await ethers.getSigners();
    startBlock = await provider.getBlock("latest");

    // Initialize wallets and contracts
    console.log("\nInitializing wallets and contracts...");
    const privateKeys = [
      process.env.WALLET_1_PRIVATE_KEY,
      process.env.WALLET_2_PRIVATE_KEY,
      process.env.WALLET_3_PRIVATE_KEY,
      process.env.WALLET_4_PRIVATE_KEY,
      process.env.WALLET_5_PRIVATE_KEY,
    ];

    // Sequential wallet initialization
    walletConnectedContracts = [];
    for (let i = 0; i < privateKeys.length; i++) {
      const contractWithWallet = await initializeWallet(privateKeys[i], i);
      walletConnectedContracts.push(contractWithWallet);
    }

    // Log initial block info
    console.log("\nStarting Block Information:");
    console.log("------------------------");
    console.log("Block Number:", startBlock.number);
    console.log("Gas Limit:", startBlock.gasLimit.toString());
    console.log("Gas Used:", startBlock.gasUsed.toString());

    // Run the test
    let successCount = 0;
    let failCount = 0;

    console.log(
      `\nAttempting to fill ${BLOCKS_TO_FILL} blocks with ${walletConnectedContracts.length} wallets in parallel...`
    );

    for (let block = 0; block < BLOCKS_TO_FILL; block++) {
      console.log(`\nBlock Attempt ${block + 1}/${BLOCKS_TO_FILL}:`);
      console.log("-------------------");

      const results = await Promise.all(
        walletConnectedContracts.map((contract, index) =>
          sendBlockFillTransaction(contract, index)
        )
      );

      const blockSuccesses = results.filter((r) => r !== null).length;
      const blockFailures = results.filter((r) => r === null).length;
      successCount += blockSuccesses;
      failCount += blockFailures;
    }

    const endBlock = await provider.getBlock("latest");
    printStatistics(
      startBlock,
      endBlock,
      successCount,
      failCount,
      walletConnectedContracts.length
    );
  });
});
