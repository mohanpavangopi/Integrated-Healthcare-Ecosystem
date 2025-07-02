const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // For MongoDB interaction
const bcrypt = require('bcryptjs');   // For password hashing
const Web3 = require('web3').default; // Access the default export for Web3 constructor

// --- MongoDB Connection ---
const MONGODB_URI = 'mongodb://localhost:27017/healthcareDApp'; // Your MongoDB connection string
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose User Schema ---
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String, required: true }, // Hashed password
    walletAddress: { type: String, required: true, unique: true }, // MetaMask wallet address
    role: { type: Number, required: true }, // Numeric role (matching Solidity enum)
    createdAt: { type: Date, default: Date.now }
});

// Create Mongoose Model
const User = mongoose.model('User', UserSchema);

// --- Web3 and Smart Contract Interaction (for backend to register on-chain role) ---
// Initialize Web3 for backend: Connect to Ganache
// Port changed to 8545 as per user's setup
const web3Backend = new Web3('http://127.0.0.1:7545'); // Ganache RPC URL

let healthcareRecordsContractBackend;
let contractABIBackend;
let contractAddressBackend;

// Load contract artifact (adjust path if you move it)
const contractArtifactPath = path.join(__dirname, 'public', 'contracts', 'HealthcareRecords.json');
const healthcareArtifact = require(contractArtifactPath); // Directly require the JSON

contractABIBackend = healthcareArtifact.abi;
// Get the deployed address for Ganache's network ID (1337)
const ganacheNetworkId = '1337'; // Default Ganache network ID
const deployedNetwork = healthcareArtifact.networks[ganacheNetworkId];

if (deployedNetwork) {
    contractAddressBackend = deployedNetwork.address;
    healthcareRecordsContractBackend = new web3Backend.eth.Contract(contractABIBackend, contractAddressBackend);
    console.log(`Backend: Smart contract loaded at ${contractAddressBackend}`);
} else {
    console.error("Backend: Smart contract not deployed on network ID 1337. Please ensure Ganache is running and contract is migrated.");
}

// Ensure the backend account can send transactions (e.g., the deployer account)
// For a production app, use environment variables for private keys
const PRIVATE_KEY = '0x049df26b143ac1db9e981929d7577fa55fe872d5fab3187377ed96db361d60b0'; // <--- REPLACE WITH A GANACHE ACCOUNT'S PRIVATE KEY (e.g., the first account)
// Make sure this account has enough Ether in Ganache!
web3Backend.eth.accounts.wallet.add(PRIVATE_KEY);
const BACKEND_ACCOUNT_ADDRESS = web3Backend.eth.accounts.wallet[0].address; // The address of the added private key
console.log(`Backend will send transactions from account: ${BACKEND_ACCOUNT_ADDRESS}`);


const app = express();
const port = 3000;

// --- Middleware ---
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, 'public'))); // Serve static frontend files

// --- API Endpoints ---

// API for User Signup
app.post('/api/signup', async (req, res) => {
    const { email, password, username, walletAddress, role } = req.body;

    // Basic validation
    if (!email || !password || !username || !walletAddress || role === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        // Check if user already exists by email or wallet address
        const existingUser = await User.findOne({ $or: [{ email: email }, { walletAddress: walletAddress }] });
        if (existingUser) {
            let message = 'User with this email or wallet address already exists.';
            if (existingUser.email === email) message = 'User with this email already exists.';
            else if (existingUser.walletAddress === walletAddress) message = 'User with this wallet address already exists.';
            return res.status(409).json({ success: false, message: message });
        }

        // Hash password before saving to MongoDB
        const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10

        // 1. Store user in MongoDB
        const newUser = new User({
            email,
            username,
            password: hashedPassword,
            walletAddress,
            role,
        });
        await newUser.save();

        // 2. Register user on the blockchain via the smart contract
        // This links the walletAddress to the role on-chain
        if (!healthcareRecordsContractBackend || !BACKEND_ACCOUNT_ADDRESS) {
            console.error("Backend: Smart contract not ready for on-chain registration.");
            return res.status(500).json({ success: false, message: 'Blockchain registration service not ready.' });
        }

        try {
            // Estimate gas for the on-chain transaction
            const gasEstimate = await healthcareRecordsContractBackend.methods.registerUser(
                walletAddress, username, role
            ).estimateGas({ from: BACKEND_ACCOUNT_ADDRESS });

            // Send transaction to register user on blockchain
            await healthcareRecordsContractBackend.methods.registerUser(
                walletAddress, username, role
            ).send({ from: BACKEND_ACCOUNT_ADDRESS, gas: gasEstimate });

            console.log(`Backend: User ${walletAddress} registered on blockchain with role ${role}.`);

        } catch (blockchainError) {
            console.error('Backend: Error registering user on blockchain:', blockchainError);
            // This means MongoDB got the user, but blockchain failed.
            // It's important to provide a specific error message here.
            // In a production app, you'd want more robust error handling and consistency.
            res.status(500).json({ success: false, message: 'User registered in DB, but failed blockchain registration. Please contact support.', error: blockchainError.message });
            return;
        }


        res.status(201).json({ success: true, message: 'User registered successfully!' });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Failed to register user.', error: error.message });
    }
});

// API for User Login
app.post('/api/login', async (req, res) => {
    const { email, password, walletAddress } = req.body;

    if (!email || !password || !walletAddress) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        // 1. Find user by email in MongoDB
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // 2. Compare provided password with hashed password from MongoDB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // 3. Verify that the wallet address provided by the client matches the one linked in the MongoDB profile.
        if (user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(403).json({ success: false, message: 'Provided MetaMask account does not match registered wallet for this user.' });
        }

        // Login successful. Return user profile data (excluding password hash)
        res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: {
                username: user.username,
                email: user.email,
                walletAddress: user.walletAddress,
                role: user.role,
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed.', error: error.message });
    }
});


// --- Serve Static Files (Frontend) ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Backend API available at http://localhost:${port}/api/*`);
  console.log(`Access your DApp at http://localhost:${port}`);
});
// Note: Ensure Ganache is running and the smart contract is deployed before starting this server.
// You can run migrations using `truffle migrate --network development` to deploy the contract.
// This server provides a REST API for user registration and login, integrating with both MongoDB and a smart contract on the blockchain.
// The API allows users to sign up and log in, with their roles and wallet addresses stored in MongoDB and registered on the blockchain.
// The frontend can interact with this API to provide a seamless user experience for healthcare data management.