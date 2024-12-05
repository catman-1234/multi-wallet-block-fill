require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

describe("Multi Wallet Block Fill Test", function () {
  // Set timeout to 1 hour
  this.timeout(60 * 60 * 1000);

  // Configuration
  const MINIMUM_WALLET_BALANCE = 0.01;
  const BLOCKS_TO_FILL = 100;

  // Test state
  let provider;
  let fundingWallet;
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

    // Connect wallet to contract
    const network = hre.network.name;
    const deploymentPath = path.join(
      __dirname,
      "../deployments",
      `${network}.json`
    );

    if (!fs.existsSync(deploymentPath)) {
      throw new Error(
        `No deployment found for network ${network}. Please run deployment script first.`
      );
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    blockMaxFiller = await ethers.getContractAt(
      "BlockMaxFiller",
      deploymentInfo.contractAddress
    );
    const contractWithSigner = blockMaxFiller.connect(wallet);
    console.log(`Wallet ${index + 1} ready:`, wallet.address);

    return { contract: contractWithSigner, wallet };
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

  async function returnFundsToFundingWallet(wallets, provider, fundingWallet) {
    console.log("\nReturning remaining funds to funding wallet...");
    let totalReturned = ethers.parseEther("0");

    for (let i = 0; i < wallets.length; i++) {
      try {
        const wallet = wallets[i];
        const balance = await provider.getBalance(wallet.getAddress());

        // Leave enough for gas (0.01 WMTx)
        const gasBuffer = ethers.parseEther("0.01");
        if (balance > gasBuffer) {
          const returnAmount = balance - gasBuffer;

          // Create and send the transaction
          const tx = await wallet.sendTransaction({
            to: fundingWallet.address,
            value: returnAmount,
            gasLimit: 21000, // Standard ETH transfer gas limit
          });

          await tx.wait();
          totalReturned += returnAmount;

          console.log(
            `Wallet ${i + 1} returned ${ethers.formatEther(returnAmount)} WMTx`
          );
        }
      } catch (error) {
        console.log(
          `Failed to return funds from wallet ${i + 1}:`,
          error.message
        );
      }
    }

    console.log(
      `Total funds returned: ${ethers.formatEther(totalReturned)} WMTx`
    );
  }

  it("Should fill blocks from multiple wallets simultaneously", async function () {
    provider = await ethers.provider;
    [fundingWallet] = await ethers.getSigners();
    startBlock = await provider.getBlock("latest");

    // Initialize wallets and contracts
    console.log("\nInitializing wallets and contracts...");
    const privateKeys = [
      process.env.WALLET_1_PRIVATE_KEY,
      process.env.WALLET_2_PRIVATE_KEY,
      process.env.WALLET_3_PRIVATE_KEY,
      process.env.WALLET_4_PRIVATE_KEY,
      process.env.WALLET_5_PRIVATE_KEY,
      process.env.WALLET_6_PRIVATE_KEY,
      process.env.WALLET_7_PRIVATE_KEY,
      process.env.WALLET_8_PRIVATE_KEY,
      process.env.WALLET_9_PRIVATE_KEY,
      process.env.WALLET_10_PRIVATE_KEY,
      process.env.WALLET_11_PRIVATE_KEY,
      process.env.WALLET_12_PRIVATE_KEY,
      process.env.WALLET_13_PRIVATE_KEY,
      process.env.WALLET_14_PRIVATE_KEY,
      process.env.WALLET_15_PRIVATE_KEY,
      process.env.WALLET_16_PRIVATE_KEY,
      process.env.WALLET_17_PRIVATE_KEY,
      process.env.WALLET_18_PRIVATE_KEY,
      process.env.WALLET_19_PRIVATE_KEY,
      process.env.WALLET_20_PRIVATE_KEY,
      process.env.WALLET_21_PRIVATE_KEY,
      process.env.WALLET_22_PRIVATE_KEY,
      process.env.WALLET_23_PRIVATE_KEY,
      process.env.WALLET_24_PRIVATE_KEY,
      process.env.WALLET_25_PRIVATE_KEY,
      process.env.WALLET_26_PRIVATE_KEY,
      process.env.WALLET_27_PRIVATE_KEY,
      process.env.WALLET_28_PRIVATE_KEY,
      process.env.WALLET_29_PRIVATE_KEY,
      process.env.WALLET_30_PRIVATE_KEY,
      process.env.WALLET_31_PRIVATE_KEY,
      process.env.WALLET_32_PRIVATE_KEY,
      process.env.WALLET_33_PRIVATE_KEY,
      process.env.WALLET_34_PRIVATE_KEY,
      process.env.WALLET_35_PRIVATE_KEY,
      process.env.WALLET_36_PRIVATE_KEY,
      process.env.WALLET_37_PRIVATE_KEY,
      process.env.WALLET_38_PRIVATE_KEY,
      process.env.WALLET_39_PRIVATE_KEY,
      process.env.WALLET_40_PRIVATE_KEY,
      process.env.WALLET_41_PRIVATE_KEY,
      process.env.WALLET_42_PRIVATE_KEY,
      process.env.WALLET_43_PRIVATE_KEY,
      process.env.WALLET_44_PRIVATE_KEY,
      process.env.WALLET_45_PRIVATE_KEY,
      process.env.WALLET_46_PRIVATE_KEY,
      process.env.WALLET_47_PRIVATE_KEY,
      process.env.WALLET_48_PRIVATE_KEY,
      process.env.WALLET_49_PRIVATE_KEY,
      process.env.WALLET_50_PRIVATE_KEY,
      process.env.WALLET_51_PRIVATE_KEY,
      process.env.WALLET_52_PRIVATE_KEY,
      process.env.WALLET_53_PRIVATE_KEY,
      process.env.WALLET_54_PRIVATE_KEY,
      process.env.WALLET_55_PRIVATE_KEY,
      process.env.WALLET_56_PRIVATE_KEY,
      process.env.WALLET_57_PRIVATE_KEY,
      process.env.WALLET_58_PRIVATE_KEY,
      process.env.WALLET_59_PRIVATE_KEY,
      process.env.WALLET_60_PRIVATE_KEY,
      process.env.WALLET_61_PRIVATE_KEY,
      process.env.WALLET_62_PRIVATE_KEY,
      process.env.WALLET_63_PRIVATE_KEY,
      process.env.WALLET_64_PRIVATE_KEY,
      process.env.WALLET_65_PRIVATE_KEY,
      process.env.WALLET_66_PRIVATE_KEY,
      process.env.WALLET_67_PRIVATE_KEY,
      process.env.WALLET_68_PRIVATE_KEY,
      process.env.WALLET_69_PRIVATE_KEY,
      process.env.WALLET_70_PRIVATE_KEY,
      process.env.WALLET_71_PRIVATE_KEY,
      process.env.WALLET_72_PRIVATE_KEY,
      process.env.WALLET_73_PRIVATE_KEY,
      process.env.WALLET_74_PRIVATE_KEY,
      process.env.WALLET_75_PRIVATE_KEY,
      process.env.WALLET_76_PRIVATE_KEY,
      process.env.WALLET_77_PRIVATE_KEY,
      process.env.WALLET_78_PRIVATE_KEY,
      process.env.WALLET_79_PRIVATE_KEY,
      process.env.WALLET_80_PRIVATE_KEY,
      process.env.WALLET_81_PRIVATE_KEY,
      process.env.WALLET_82_PRIVATE_KEY,
      process.env.WALLET_83_PRIVATE_KEY,
      process.env.WALLET_84_PRIVATE_KEY,
      process.env.WALLET_85_PRIVATE_KEY,
      process.env.WALLET_86_PRIVATE_KEY,
      process.env.WALLET_87_PRIVATE_KEY,
      process.env.WALLET_88_PRIVATE_KEY,
      process.env.WALLET_89_PRIVATE_KEY,
      process.env.WALLET_90_PRIVATE_KEY,
      process.env.WALLET_91_PRIVATE_KEY,
      process.env.WALLET_92_PRIVATE_KEY,
      process.env.WALLET_93_PRIVATE_KEY,
      process.env.WALLET_94_PRIVATE_KEY,
      process.env.WALLET_95_PRIVATE_KEY,
      process.env.WALLET_96_PRIVATE_KEY,
      process.env.WALLET_97_PRIVATE_KEY,
      process.env.WALLET_98_PRIVATE_KEY,
      process.env.WALLET_99_PRIVATE_KEY,
      process.env.WALLET_100_PRIVATE_KEY,
    ];

    // Sequential wallet initialization
    const wallets = [];
    walletConnectedContracts = [];
    for (let i = 0; i < privateKeys.length; i++) {
      const { contract, wallet } = await initializeWallet(privateKeys[i], i);
      walletConnectedContracts.push(contract);
      wallets.push(wallet);
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

    await returnFundsToFundingWallet(wallets, provider, fundingWallet);
  });
});
