const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

async function main() {
  // Get number of wallets from command line args, default to 5
  const args = process.argv.slice(2);
  const numWallets = args.length > 0 ? parseInt(args[0]) : 5;

  if (isNaN(numWallets) || numWallets <= 0) {
    console.error("Please provide a valid number of wallets to generate");
    process.exit(1);
  }

  const wallets = [];
  for (let i = 0; i < numWallets; i++) {
    const wallet = ethers.Wallet.createRandom();
    wallets.push({
      index: i + 1,
      address: wallet.address,
      privateKey: wallet.privateKey,
    });
  }

  // Create output
  let envFormat = "# Generated Wallet Private Keys\n";
  let markdownFormat = "# Generated Wallets\n\n";

  wallets.forEach((wallet) => {
    envFormat += `WALLET_${wallet.index}_PRIVATE_KEY=${wallet.privateKey}\n`;
    markdownFormat += `## Wallet ${wallet.index}\n`;
    markdownFormat += `- Address: \`${wallet.address}\`\n`;
    markdownFormat += `- Private Key: \`${wallet.privateKey}\`\n\n`;
  });

  // Generate unique filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `generated-wallets-${timestamp}.md`;

  // Save to file
  fs.writeFileSync(
    path.join(__dirname, "..", "generated", filename),
    markdownFormat
  );

  // Create .env format output
  console.log("\nAdd these lines to your .env file:");
  console.log("----------------------------------------");
  console.log(envFormat);
  console.log("----------------------------------------");
  console.log(`\nFull wallet details saved to: generated/${filename}`);
}

// Create 'generated' directory if it doesn't exist
const generatedDir = path.join(__dirname, "..", "generated");
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
