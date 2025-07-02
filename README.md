# Integrated-Healthcare-Ecosystem-
Integrated Healthcare Ecosystem using Blockchain & MongoDB
MedChain is a decentralized application (DApp) designed to address critical gaps in healthcare coordination and data management. It leverages blockchain technology for secure, immutable medical record management and a MongoDB backend for flexible user authentication and profile management. This hybrid approach ensures data integrity and privacy while maintaining the scalability and flexibility needed for a comprehensive healthcare platform.

🌟 Features
Secure User Authentication: Users can sign up and log in with email, password, and a connected Ethereum wallet address, with roles stored in MongoDB.

Role-Based Access Control:

Doctors: Can add new medical records for patients, including IPFS hashes for detailed reports, drug information, quantities, and diagnoses. They can also view all patient records.

Patients: Can view their own medical records.

Drug Manufacturers: Can view specific drug-related details (drug used, quantity, cause) from patient records, ensuring data privacy for other medical information.

Insurance Companies: Can view full patient medical records for claim assessment.

Immutable Medical Records: Healthcare records are stored on a private Ethereum blockchain, ensuring tamper-proof and verifiable data.

Off-Chain Data Integration (IPFS): Supports linking to larger, off-chain medical reports via IPFS Content IDs (CIDs), optimizing blockchain storage.

Modern UI/UX: A sleek, responsive user interface built with HTML, Tailwind CSS, and custom CSS for a professional and intuitive experience.

🛠️ Technologies Used
Blockchain:

Solidity: Smart contract language for HealthcareRecords.sol.

Truffle Suite: Development framework for compiling, deploying, and testing smart contracts.

Ganache: Personal blockchain for local Ethereum development and testing.

Web3.js: JavaScript library for interacting with the Ethereum blockchain from the frontend.

Backend:

Node.js: JavaScript runtime environment.

Express.js: Web framework for building the RESTful API.

MongoDB: NoSQL database for user authentication and profile management.

Mongoose: ODM (Object Data Modeling) library for MongoDB and Node.js.

Dotenv: For managing environment variables.

Bcrypt.js: For password hashing.

Frontend:

HTML5: Structure of the web application.

Tailwind CSS: Utility-first CSS framework for rapid styling.

Custom CSS: For unique design elements (gradients, glassmorphism, specific component styles).

JavaScript (Vanilla JS): Frontend logic for UI interactions, form handling, and Web3.js integration.

Font Awesome: Icon library for a modern visual appeal.

Other:

IPFS (InterPlanetary File System): Conceptual integration for storing large medical reports off-chain (requires a separate IPFS setup for full functionality).

🚀 Getting Started
Follow these steps to set up and run the MedChain DApp locally.

Prerequisites
Before you begin, ensure you have the following installed:

Node.js (LTS version recommended) & npm (Node Package Manager)

Truffle Suite: npm install -g truffle

Ganache Desktop Application or Ganache CLI: For a local Ethereum blockchain.

MetaMask Browser Extension: Connected to your local Ganache network.

MongoDB: A running MongoDB instance (local or cloud-hosted like MongoDB Atlas).

Installation & Setup
Clone the repository:

git clone <your-repository-url>
cd healthcare-dapp # Or your actual project folder name

Install Node.js dependencies:

npm install

Set up Ganache:

Open Ganache.

Create a new workspace.

Ensure it's running on http://127.0.0.1:8545 (default).

Import one of Ganache's generated accounts into your MetaMask wallet. This account will be used for deploying the contract and for user interactions. Make sure it has sufficient test ETH.

Configure Environment Variables for Backend:

Create a .env file in the root directory of your project (same level as server.js).

Add the following variables:

MONGO_URI=mongodb://localhost:27017/medchain # Or your MongoDB Atlas URI
GANACHE_URL=http://127.00.1:8545
PRIVATE_KEY=<Your_MetaMask_Account_Private_Key_from_Ganache> # IMPORTANT: Use a test account's private key ONLY. Never use a mainnet key.
JWT_SECRET=your_jwt_secret_key # Choose a strong, random string

To get your MetaMask account's private key from Ganache: In Ganache, click the "key" icon next to an account address to reveal its private key.

Compile and Deploy the Smart Contract:

Open a new terminal in the healthcare-dapp root directory.

Compile the contract:

truffle compile

Deploy the contract to your Ganache network:

truffle migrate --network development --reset

Copy Contract Artifact: After deployment, you need to copy the HealthcareRecords.json file from build/contracts/ to public/contracts/. Create the public/contracts directory if it doesn't exist.

mkdir -p public/contracts # Create directory if it doesn't exist
cp build/contracts/HealthcareRecords.json public/contracts/

Important: If you modify contracts/HealthcareRecords.sol, you must re-run truffle compile, truffle migrate --network development --reset, and then re-copy the artifact for changes to take effect on the frontend.

Start the Node.js Backend Server:

In a new terminal (or the one where you installed npm dependencies), run:

node server.js

You should see a message like "Server running on port 3000" and "MongoDB connected."

🚀 Usage
Access the Application:

Open your web browser and navigate to http://localhost:3000.

Connect MetaMask:

Ensure your MetaMask is unlocked and connected to your Ganache network (http://127.0.0.1:8545).

Sign Up as Different Roles:

On the login page, click the "Sign Up" tab.

Select a role (e.g., Doctor, Patient, Drug Manufacturer, Insurance Co.).

Enter an email, username, and password.

Click "Sign Up Securely". This will register the user in MongoDB and on the blockchain.

Repeat this process for at least one Doctor, one Patient, one Drug Manufacturer, and one Insurance Company using different MetaMask accounts (from Ganache) for each role to test the role-based functionalities.

Login:

Switch back to the "Login" tab.

Enter the email and password for a registered user.

Ensure the correct MetaMask account for that user is selected.

Click "Sign In Securely".

Explore the Dashboard:

Upon successful login, you will be redirected to the dashboard.

The dashboard dynamically adjusts based on the logged-in user's role:

Doctor: Can see the "Add New Healthcare Record" section and "View Patient Records" section (can input any patient address).

Patient: Can only see the "View Patient Records" section, pre-filled with their own wallet address (read-only).

Drug Manufacturer: Can see the "View Patient Records" section, but when viewing records, only drug-related details (Drug Used, Quantity, Cause) are displayed.

Insurance Company: Can see the "Insurance Claim Assessment" information and the "View Patient Records" section (can input any patient address).

Add/View Records (Example - Doctor Role):

Log in as a Doctor.

In the "Add New Healthcare Record" section, fill in the details:

Patient Wallet Address: Enter the MetaMask address of a registered Patient.

IPFS Hash: (Optional) For a real IPFS integration, you would upload a file to IPFS and paste its CID here. For testing, you can put a placeholder like Qm...yourhash....

Description, Drug Used, Quantity, Cause: Fill in sample data.

Click "Add Record to Blockchain". Confirm the transaction in MetaMask.

In the "View Patient Records" section, enter the Patient's wallet address and click "View Records" to see the newly added record.

View Records (Example - Drug Manufacturer Role):

Log in as a Drug Manufacturer.

In the "View Patient Records" section, enter a Patient's wallet address (for whom a Doctor has added records with drug details).

Click "View Drug Details". Observe that only the drug-related fields are displayed.

📂 Project Structure
Integrated Healthcare Ecosystem/
├── contracts/
│   └── HealthcareRecords.sol     # Smart contract for managing healthcare records
├── migrations/
│   └── 1_deploy_contracts.js     # Truffle deployment script
├── build/                        # Truffle build artifacts (ABI, bytecode)
│   └── contracts/
│       └── HealthcareRecords.json
├── node_modules/                 # Node.js dependencies
├── public/
│   ├── contracts/
│   │   └── HealthcareRecords.json  # Copied contract artifact for frontend access
│   ├── index.html                # Frontend HTML (contains all HTML, CSS, JS)
│   └── style.css                 # Custom CSS for the new design (if separated)
│   └── app.js                    # Frontend JavaScript logic (if separated)
├── package.json                  # Project dependencies and scripts
├── package-lock.json             # Locked dependencies
├── server.js                     # Node.js backend server (Express, Mongoose, User Auth)
├── truffle-config.js             # Truffle configuration
└── .env                          # Environment variables (MongoDB URI, Private Key, JWT Secret)
└── README.md                     # This file

💡 Future Enhancements
Full IPFS Integration: Implement actual IPFS file uploads and retrievals from the frontend.

Advanced Dashboard Analytics: Integrate charting libraries (e.g., Chart.js, D3.js) to visualize healthcare data.

Notifications: Implement real-time notifications for new records, updates, or critical alerts.

User Profile Management: Allow users to update their personal information from the dashboard.

Multi-Factor Authentication: Enhance security with additional authentication layers.

Audit Trails: Implement more detailed logging and auditing features.

Mobile Responsiveness: Further optimize the design for various mobile devices.

Testing: Add comprehensive unit and integration tests for both smart contracts and backend.

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
