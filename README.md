# MultiWalletBlockFill

A load test using multiple wallets to create many heavy transactions to try and fill blocks.

## Prerequisites

1. **Node.js (v14 or higher)**

   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Yarn Package Manager**

   - Install with: `npm install -g yarn`
   - Verify installation: `yarn --version`

3. **Funding Wallet**
   - Minimum 0.5 WMTx balance
   - Will be used to fund test wallets
   - Use a dedicated testing wallet, not your main wallet

## Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/MultiWalletBlockFill.git
   cd MultiWalletBlockFill
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
   CONTRACT_ADDRESS=BlockMaxFiller_address_found_in_explorer
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

4. Run the test:
   ```bash
   yarn test
   ```

## What the Test Does

1. Loads 5 test wallets from environment variables
2. Funds each test wallet with 0.1 WMTx automatically from the funding wallet
3. Attempts to fill 100 blocks by having each wallet send concurrent transactions to the BlockMaxFiller contract:
   - First transaction: Calls `clearStorage()` to reset 3000 storage slots
   - Second transaction: Calls `fillBlock()` which:
     - Performs 20 factorial calculations, storing results across multiple slots
     - Writes to ~1000 additional storage slots
     - Emits debug events at key intervals
4. Tracks transaction success/failure rates and block utilization

The test is designed to stress-test block capacity by maximizing storage operations and state changes within each block through parallel wallet interactions with the contract.

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

## Resource Requirements

- Funding wallet: ~0.5 WMTx (0.1 WMTx per test wallet)
- Test duration: 15-30 minutes
- Stable network connection

## Troubleshooting

Common issues and solutions:

1. **Wallet Funding Failures**

   - Verify funding wallet balance

2. **Test Timeouts**
   - Default timeout: 1 hour
   - Adjust in test file if needed

## Security Notes

- Never commit `.env` file to version control
- Use dedicated testing wallets only
- Verify blocks are being produced on the network before running the test

## License

This project is licensed under the MIT License - see the LICENSE file for details.
