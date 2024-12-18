# multi-wallet-block-fill

A load test using multiple wallets to create many heavy transactions to try and fill blocks.

## Prerequisites

1. **Node.js (v14 or higher)**

   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Yarn Package Manager**

   - Install with: `npm install -g yarn`
   - Verify installation: `yarn --version`

3. **Funding Wallet**
   - Minimum 0.5 WMTx balance on WMC Base Testnet
   - Will be used to fund test wallets
   - Use a dedicated testing wallet, not your main wallet

## Quick Start

1. Clone the repository:

   ```bash
   git clone git@github.com:catman-1234/multi-wallet-block-fill.git
   cd multi-wallet-block-fill
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Create a `.env` file in the root directory:

   ```env
   FUNDING_WALLET_PRIVATE_KEY=your_funding_wallet_private_key
   WALLET_1_PRIVATE_KEY=your_wallet_1_private_key
   WALLET_2_PRIVATE_KEY=your_wallet_2_private_key
   WALLET_3_PRIVATE_KEY=your_wallet_3_private_key
   WALLET_4_PRIVATE_KEY=your_wallet_4_private_key
   WALLET_5_PRIVATE_KEY=your_wallet_5_private_key
   WORLDMOBILE_BASE_TESTNET_RPC_URL=worldmobile_base_testnet_rpc_endpoint
   ```

   If you don't have extra wallets to use, you can generate some with the following command:

   ```bash
   yarn generate-wallets
   ```

   This will generate 5 wallets by default but you can pass in a number as an argument to generate more or less:

   ```bash
   yarn generate-wallets 10
   ```

   The generated wallets will be output to the console and also saved to a file in the `/generated` directory eg. `generated/generated-wallets-2024-12-03T20-26-50-959Z.md`
   Copy the private keys and paste them into the `.env` file. They will be funded with 0.1 WMTx from your funding wallet during the test.

   If you want to use more or less than the default amount of 5 in the test then you will also need to edit the `Initialize wallets and contracts` section of the test and pass the correct environment variables.

   You can check the balance of all wallets in your .env file with:

   ```bash
   yarn check-balances
   ```

   This will show the balance of your funding wallet and all test wallets.

   You can check the current gas price on the network with:

   ```bash
   yarn check-gas
   ```

   This will display the gas price in WMTx, Gwei, and Wei units.

4. Deploy the contract:

   Before deploying, you can customize the contract to suit your needs. The contract files are located in the `contracts` directory. Make any necessary changes to the contract code, such as modifying functions, adding new features, or adjusting parameters.

   Once you have made your changes, deploy the contract using the following command:

   ```bash
   yarn deploy
   ```

   This will deploy the contract to the network specified in your Hardhat configuration and save the contract address in `deployments/worldmobileBase.json`. Ensure that your `.env` file is correctly configured with the necessary network RPC URL and private keys.

   If you encounter any issues during deployment, check the console output for error messages and verify your network connection and configuration settings.

   You don't need to deploy every time you run the test, only do it when you make changes to the contract.

5. Run the test:
   ```bash
   yarn test
   ```

## What the Test Does

1. Loads test wallets from environment variables
2. Funds each test wallet with 0.1 WMTx automatically from the funding wallet
3. Attempts to fill blocks by having each wallet send concurrent transactions to the BlockMaxFiller contract:
   - First transaction: Calls `clearStorage()` to reset storage slots
   - Second transaction: Calls `fillBlock()` which:
     - Performs factorial calculations and stores results across slots
     - Writes to additional storage slots
     - Emits debug events at key intervals
4. Tracks transaction success/failure rates and block utilization
5. Returns remaining funds from test wallets back to the funding wallet after completion

The test is designed to test block capacity by using multiple wallets to send transactions in parallel, attempting to maximize the number of transactions that can fit in each block.

## Expected Output

The test will show:

- Initial wallet balances and funding status
- Block information
- Transaction attempts and results per wallet
- Final statistics including:
  - Processed blocks count
  - Total transaction attempts
  - Success/failure rates
  - Overall performance metrics
- Cleanup status showing funds returned to funding wallet

## Resource Requirements

- Funding wallet: Minimum balance required = (number of test wallets × WMTx per wallet, currently set to 0.01 in the test)
  - Example: For 100 wallets = 1 WMTx minimum
  - Add extra for gas fees and safety margin
- Test duration: 15-30 minutes (may vary based on number of wallets)
- Stable network connection

## Troubleshooting

Common issues and solutions:

1. **Wallet Funding Failures**

   - Verify funding wallet balance

2. **Test Timeouts**

   - Default timeout: 1 hour
   - Adjust in test file if needed

3. **Network Issues**

   - Verify blocks are being produced on the network before running the test

4. **Gas Price**

   - Wallets can run out of gas if the gas price is too high
   - You can check the current gas price on the network with:

   ```bash
   yarn check-gas
   ```

## Security Notes

- Never commit the `.env` or the generated wallets files to version control
- Use dedicated testing wallets only

## License

This project is licensed under the MIT License - see the LICENSE file for details.
