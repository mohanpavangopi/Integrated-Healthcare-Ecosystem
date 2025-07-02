const path = require("path");

module.exports = {
  // Directories where Truffle looks for contracts and build artifacts
  contracts_build_directory: path.join(__dirname, "public/contracts"), // Output compiled artifacts here

  // Networks to connect to (e.g., Ganache, Sepolia, Mainnet)
  networks: {
    // Development network using Ganache
    development: {
      host: "127.0.0.1",     // Localhost (your computer)
      port: 7545,            // Standard Ganache RPC port
      network_id: "*",    // Any network id, or "5777" for older Ganache
      // The `gas` and `gasPrice` are estimates.
      // Adjust these based on your network and contract complexity.
      gas: 6721975,          // Gas limit for transactions
      gasPrice: 20000000000  // 20 Gwei
    }
    // You can add other networks here, e.g., Sepolia testnet
    /*
    sepolia: {
      provider: () => new HDWalletProvider(mnemonic, `https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID`),
      network_id: 11155111,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    */
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0",    // Fetch exact version from solc-bin (e.g. "0.8.0")
      // docker: true,        // Use "0.5.1" you can also specify a docker image
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200
        },
        // evmVersion: "byzantium" // You might need to adjust this depending on your target chain
      }
    }
  },

  // To build DApps with front-end frameworks (like React, Vue, or Angular),
  // Truffle needs to know where to save the compiled artifacts.
  // We're saving them to `public/contracts` so our frontend can access them.
  // This helps us get the contract ABI and address after deployment.
};
