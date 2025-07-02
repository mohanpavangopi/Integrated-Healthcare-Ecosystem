// Global variables for Web3 and contract instances
let web3;
let healthcareRecordsContract;
let selectedAccount;      // The user's MetaMask account, linked to MongoDB user
let currentUserRole = 0;  // Stores the numeric enum value of the current user's role
let currentUsername = ''; // Stores the current user's username (from MongoDB profile)
let currentEmail = '';    // Stores the current user's email (from MongoDB profile)

let contractABI;          // To store the ABI loaded from artifact
let contractAddress;      // To store the deployed contract address

// Enum mapping for roles (must match Solidity enum order)
const UserRoleEnum = {
    None: 0,
    Patient: 1,
    Doctor: 2,
    DrugManufacturer: 3,
    InsuranceCompany: 4 
};
// Reverse mapping for display purposes
const UserRoleName = Object.keys(UserRoleEnum);

// --- UI Element References ---
const authCard = document.getElementById('authCard');
const authTitle = document.getElementById('authTitle');
const showLoginBtn = document.getElementById('showLoginBtn');
const showSignupBtn = document.getElementById('showSignupBtn');
const emailInput = document.getElementById('emailInput');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const authActionButton = document.getElementById('authActionButton');
const authMessageBox = document.getElementById('authMessageBox');

const appDashboard = document.getElementById('appDashboard');
const loggedInUsernameSpan = document.getElementById('loggedInUsername');
const loggedInRoleSpan = document.getElementById('loggedInRole');
const userWalletAddressSpan = document.getElementById('userWalletAddress');
const logoutButton = document.getElementById('logoutButton');

const roleButtons = document.querySelectorAll('.role-button');
let selectedRoleForAuth = UserRoleEnum.None; // Stores the role selected by user on auth card

// Add/View Records sections
const addRecordSection = document.getElementById('addRecordSection');
const viewRecordSection = document.getElementById('viewRecordSection');
const patientAddressInput = document.getElementById('patientAddressInput');
const dataHashInput = document.getElementById('dataHashInput');
const descriptionInput = document.getElementById('descriptionInput');
const drugUsedInput = document.getElementById('drugUsedInput');
const quantityInput = document.getElementById('quantityInput');
const causeInput = document.getElementById('causeInput');
const addRecordButton = document.getElementById('addRecordButton');
const addRecordMessage = document.getElementById('addRecordMessage');

const viewPatientAddressInput = document.getElementById('viewPatientAddressInput');
const viewRecordsButton = document.getElementById('viewRecordsButton');
const viewRecordsMessage = document.getElementById('viewRecordsMessage');
const recordsList = document.getElementById('recordsList');
const noRecordsFound = document.getElementById('noRecordsFound');
const viewRecordsTitle = document.getElementById('viewRecordsTitle');

// New: Insurance Claim Info Section
const insuranceClaimInfoSection = document.getElementById('insuranceClaimInfoSection');


// --- Authentication Mode ---
let isLoginMode = true; // True for login, false for signup

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    // Role selection on auth card
    roleButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Remove highlight from previously selected button
            roleButtons.forEach(btn => {
                btn.classList.remove('ring-4', 'ring-offset-2', 'ring-opacity-75', 'ring-yellow-400');
            });
            // Add highlight to the clicked button
            event.currentTarget.classList.add('ring-4', 'ring-offset-2', 'ring-opacity-75', 'ring-yellow-400');
            const roleName = event.currentTarget.dataset.role.replace(/\s+/g, '');
            selectedRoleForAuth = UserRoleEnum[roleName.charAt(0).toUpperCase() + roleName.slice(1)];

            if (selectedRoleForAuth === undefined || selectedRoleForAuth === UserRoleEnum.None) {
                showMessage("Invalid role selected. Please choose a valid role.", "error", authMessageBox);
            } else {
                showMessage(`Selected role: ${UserRoleName[selectedRoleForAuth]}`, "info", authMessageBox);
            }
        });
    });

    // Login/Signup mode switch
    showLoginBtn.addEventListener('click', () => setAuthMode(true));
    showSignupBtn.addEventListener('click', () => setAuthMode(false));
    authActionButton.addEventListener('click', handleAuthAction);
    logoutButton.addEventListener('click', handleLogout);

    // DApp functionality buttons
    addRecordButton.addEventListener('click', addHealthcareRecord);
    viewRecordsButton.addEventListener('click', viewPatientRecords);

    // Initial setup
    setAuthMode(true); // Default to login mode
    await initWeb3(); // Only initialize Web3 and contract
});

/**
 * @dev Initializes Web3.js and connects to the Ethereum provider (MetaMask).
 * This is called on initial page load to ensure MetaMask is detected.
 */
async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        await loadContract(); // Load contract ABI and address

        // Listen for account and chain changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        // Check if an account is already connected to MetaMask
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            selectedAccount = accounts[0];
            showMessage(`MetaMask detected and connected: ${selectedAccount}.`, "info", authMessageBox);
        } else {
            showMessage("MetaMask detected. Please connect your account.", "info", authMessageBox);
        }
    } else {
        showMessage("MetaMask is not installed. Please install it to use this DApp.", "error", authMessageBox);
        console.warn("Please install MetaMask!");
    }
}

/**
 * @dev Loads the smart contract ABI and address from the Truffle build artifact.
 * Initializes the Web3 contract instance.
 */
async function loadContract() {
    try {
        const response = await fetch('./contracts/HealthcareRecords.json');
        const artifact = await response.json();
        contractABI = artifact.abi;

        const networkId = await web3.eth.net.getId();
        const deployedNetwork = artifact.networks[networkId];

        if (deployedNetwork) {
            contractAddress = deployedNetwork.address;
            healthcareRecordsContract = new web3.eth.Contract(contractABI, contractAddress);
            showMessage(`Contract loaded successfully at address: ${contractAddress}`, "success", authMessageBox);
        } else {
            showMessage("Contract not deployed on the current network. Please deploy it first.", "error", authMessageBox);
            console.error("Contract not deployed on detected network ID:", networkId);
        }
    } catch (error) {
        console.error("Error loading contract:", error);
        showMessage("Failed to load smart contract. Ensure it's deployed and server is running.", "error", authMessageBox);
    }
}

/**
 * @dev Handles changes in MetaMask accounts.
 * @param {string[]} accounts The new array of accounts.
 */
async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        showMessage("MetaMask disconnected. Please connect an account.", "error", authMessageBox);
        handleLogoutUI(); // Clear UI if wallet disconnects
    } else if (accounts[0].toLowerCase() !== selectedAccount.toLowerCase()) {
        selectedAccount = accounts[0];
        showMessage(`MetaMask account changed to: ${selectedAccount}. Please re-login.`, "info", authMessageBox);
        handleLogoutUI(); // Force re-login with the new account
    }
}

/**
 * @dev Handles changes in the connected blockchain network.
 */
function handleChainChanged(chainId) {
    showMessage("Network changed. Please refresh the page.", "info", authMessageBox);
    console.log("Chain ID changed to:", chainId);
    window.location.reload();
}

/**
 * @dev Switches between Login and Sign Up modes.
 * @param {boolean} loginMode If true, sets to login mode; if false, sets to signup mode.
 */
function setAuthMode(loginMode) {
    isLoginMode = loginMode;
    if (isLoginMode) {
        authTitle.textContent = "Login";
        authActionButton.textContent = "Login";
        showLoginBtn.classList.add('bg-indigo-100', 'text-indigo-700');
        showLoginBtn.classList.remove('bg-transparent', 'text-indigo-500');
        showSignupBtn.classList.add('bg-transparent', 'text-indigo-500');
        showSignupBtn.classList.remove('bg-indigo-100', 'text-indigo-700');
    } else {
        authTitle.textContent = "Sign Up";
        authActionButton.textContent = "Sign Up";
        showSignupBtn.classList.add('bg-indigo-100', 'text-indigo-700');
        showSignupBtn.classList.remove('bg-transparent', 'text-indigo-500');
        showLoginBtn.classList.add('bg-transparent', 'text-indigo-500');
        showLoginBtn.classList.remove('bg-indigo-100', 'text-indigo-700');
    }
    authMessageBox.classList.add('hidden'); // Clear message when switching mode
    emailInput.value = '';
    usernameInput.value = '';
    passwordInput.value = '';
    // Clear selected role highlight
    roleButtons.forEach(btn => {
        btn.classList.remove('ring-4', 'ring-offset-2', 'ring-opacity-75', 'ring-yellow-400');
    });
    selectedRoleForAuth = UserRoleEnum.None; // Reset selected role
}

/**
 * @dev Handles the authentication action (Login or Sign Up) based on current mode.
 */
async function handleAuthAction() {
    // Ensure MetaMask is connected before attempting auth actions
    if (!selectedAccount) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            selectedAccount = accounts[0];
            showMessage(`MetaMask account connected: ${selectedAccount}.`, "success", authMessageBox);
        } catch (error) {
            console.error("MetaMask connection failed:", error);
            showMessage("Please connect your MetaMask account to proceed.", "error", authMessageBox);
            return;
        }
    }

    if (isLoginMode) {
        await handleLogin();
    } else {
        await handleSignup();
    }
}

/**
 * @dev Handles user registration (Sign Up) with the Node.js backend.
 */
async function handleSignup() {
    const email = emailInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (selectedRoleForAuth === UserRoleEnum.None) {
        showMessage("Please select your role for registration.", "error", authMessageBox);
        return;
    }
    if (!email || !username || !password) {
        showMessage("Please fill all fields.", "error", authMessageBox);
        return;
    }
    if (!selectedAccount) {
        showMessage("Please connect your MetaMask wallet first.", "error", authMessageBox);
        return;
    }

    showMessage("Sending signup request to backend...", "info", authMessageBox);

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                username: username,
                walletAddress: selectedAccount,
                role: selectedRoleForAuth // Pass numeric role
            })
        });
        const data = await response.json();

        if (data.success) {
            showMessage(`Successfully registered! Please login now.`, "success", authMessageBox);
            setAuthMode(true); // Switch to login mode after successful signup
        } else {
            showMessage(`Signup failed: ${data.message}`, "error", authMessageBox);
        }
    } catch (error) {
        console.error("Frontend: Signup API call failed:", error);
        showMessage("Signup failed. Server error or network issue. See console.", "error", authMessageBox);
    }
}

/**
 * @dev Handles user login with the Node.js backend.
 */
async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage("Please enter email and password.", "error", authMessageBox);
        return;
    }
    if (!selectedAccount) {
        showMessage("Please connect your MetaMask wallet first.", "error", authMessageBox);
        return;
    }

    showMessage("Sending login request to backend...", "info", authMessageBox);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                walletAddress: selectedAccount // Send connected wallet for verification
            })
        });
        const data = await response.json();

        if (data.success) {
            currentUsername = data.user.username;
            currentEmail = data.user.email;
            currentUserRole = data.user.role; // Get role from backend (MongoDB)

            // Now, optionally verify the role on-chain to be absolutely sure
            try {
                const onChainUser = await healthcareRecordsContract.methods.getUser(selectedAccount).call();
                const onChainRole = Number(onChainUser[1]);

                if (onChainRole !== currentUserRole) {
                    console.warn(`Role mismatch: MongoDB says ${UserRoleName[currentUserRole]}, Blockchain says ${UserRoleName[onChainRole]}. Blockchain role takes precedence for DApp actions.`);
                    currentUserRole = onChainRole; // Prefer blockchain role for DApp actions
                }
                showMessage(`Login successful! Welcome ${currentUsername} (${UserRoleName[currentUserRole]}).`, "success", authMessageBox);
                displayDashboard();

            } catch (error) {
                // This means the user's wallet is not registered on the blockchain
                // This shouldn't happen if backend signup worked, but for robustness:
                console.error("Blockchain registration mismatch for logged-in user:", error);
                showMessage("Login successful to backend, but your wallet is not registered on the blockchain. Please contact support or re-register.", "error", authMessageBox);
                handleLogoutUI(); // Force logout
            }

        } else {
            showMessage(`Login failed: ${data.message}`, "error", authMessageBox);
        }
    } catch (error) {
        console.error("Frontend: Login API call failed:", error);
        showMessage("Login failed. Server error or network issue. See console.", "error", authMessageBox);
    }
}

/**
 * @dev Displays the DApp dashboard and adjusts sections based on user role.
 */
async function displayDashboard() {
    authCard.style.display = 'none';
    appDashboard.style.display = 'block';

    loggedInUsernameSpan.textContent = currentUsername;
    loggedInRoleSpan.textContent = UserRoleName[currentUserRole];
    userWalletAddressSpan.textContent = selectedAccount;

    // Reset visibility of all role-specific sections
    addRecordSection.style.display = 'none';
    viewRecordSection.style.display = 'none';
    insuranceClaimInfoSection.style.display = 'none'; // Hide by default

    // Adjust sections and their behavior based on currentUserRole
    if (currentUserRole === UserRoleEnum.Doctor) {
        addRecordSection.style.display = 'block'; // Doctors can add records
        viewRecordSection.style.display = 'block'; // Doctors can view records
        // Clear input fields for adding records
        patientAddressInput.value = '';
        dataHashInput.value = '';
        descriptionInput.value = '';
        drugUsedInput.value = '';
        quantityInput.value = '';
        causeInput.value = '';

        viewPatientAddressInput.value = ''; // Doctors can view any patient's records
        viewPatientAddressInput.readOnly = false;
        viewRecordsTitle.textContent = "View All Patient Records";
        viewRecordsButton.textContent = "View Records";

    } else if (currentUserRole === UserRoleEnum.Patient) {
        viewRecordSection.style.display = 'block'; // Patients can view their own records
        viewPatientAddressInput.value = selectedAccount; // Patients can only view their own records
        viewPatientAddressInput.readOnly = true;
        viewRecordsTitle.textContent = "View My Medical Records";
        viewRecordsButton.textContent = "View My Records";
        await viewPatientRecords(); // Auto-load patient's own records

    } else if (currentUserRole === UserRoleEnum.DrugManufacturer) {
        viewRecordSection.style.display = 'block'; // Drug manufacturers can view drug details
        viewPatientAddressInput.value = ''; // They need to enter a patient address
        viewPatientAddressInput.readOnly = false;
        viewRecordsTitle.textContent = "View Drug Details for Patient"; // Specific title for their view
        viewRecordsButton.textContent = "View Drug Details";

    } else if (currentUserRole === UserRoleEnum.InsuranceCompany) { // New role
        insuranceClaimInfoSection.style.display = 'block'; // Show claim info section
        viewRecordSection.style.display = 'block'; // Insurance company can view all records
        viewPatientAddressInput.value = ''; // They can view any patient's records
        viewPatientAddressInput.readOnly = false;
        viewRecordsTitle.textContent = "View Medical History for Claim Assessment"; // Specific title
        viewRecordsButton.textContent = "View Medical History";
    }

    // Clear previously loaded records when dashboard is displayed
    recordsList.innerHTML = '';
    noRecordsFound.classList.add('hidden');
}


/**
 * @dev Handles logout, clearing UI state.
 */
async function handleLogout() {
    // In a production app, you might invalidate a session token here
    showMessage("Logged out.", "info", authMessageBox);
    handleLogoutUI();
}

/**
 * @dev Updates UI to logged-out state.
 */
function handleLogoutUI() {
    selectedAccount = null;
    currentUserRole = UserRoleEnum.None;
    currentUsername = '';
    currentEmail = '';

    appDashboard.style.display = 'none';
    authCard.style.display = 'block';
    setAuthMode(true); // Reset to login mode on logout
}

/**
 * @dev Adds a new healthcare record to the blockchain.
 * Only Doctors can call this successfully.
 */
async function addHealthcareRecord() {
    if (!healthcareRecordsContract || !selectedAccount) {
        showMessage("Web3 not initialized or account not connected.", "error", addRecordMessage);
        return;
    }
    if (currentUserRole !== UserRoleEnum.Doctor) {
        showMessage("Permission Denied: Only Doctors can add full patient records.", "error", addRecordMessage);
        return;
    }

    const patientAddress = patientAddressInput.value;
    const dataHash = dataHashInput.value;
    const description = descriptionInput.value;
    const drugUsed = drugUsedInput.value;
    const quantity = parseInt(quantityInput.value); // Convert to integer
    const cause = causeInput.value;

    // Basic validation for new fields
    if (!drugUsed) { showMessage("Drug Used cannot be empty.", "error", addRecordMessage); return; }
    if (isNaN(quantity) || quantity <= 0) { showMessage("Quantity must be a positive number.", "error", addRecordMessage); return; }
    if (!cause) { showMessage("Cause/Diagnosis cannot be empty.", "error", addRecordMessage); return; }
    if (!patientAddress || !web3.utils.isAddress(patientAddress)) { showMessage("Please enter a valid patient Ethereum address.", "error", addRecordMessage); return; }
    if (!dataHash) { showMessage("Please enter a data hash (e.g., IPFS CID).", "error", addRecordMessage); return; }
    if (!description) { showMessage("Please enter a brief description.", "error", addRecordMessage); return; }


    showMessage("Sending transaction to add record... Please confirm in MetaMask.", "info", addRecordMessage);

    try {
        const gasEstimate = await healthcareRecordsContract.methods.addRecord(
            patientAddress, dataHash, description, drugUsed, quantity, cause
        ).estimateGas({ from: selectedAccount });

        await healthcareRecordsContract.methods.addRecord(
            patientAddress, dataHash, description, drugUsed, quantity, cause
        ).send({ from: selectedAccount, gas: gasEstimate });

        showMessage("Record added successfully to the blockchain!", "success", addRecordMessage);
        // Clear input fields
        patientAddressInput.value = '';
        dataHashInput.value = '';
        descriptionInput.value = '';
        drugUsedInput.value = '';
        quantityInput.value = '';
        causeInput.value = '';
        // Automatically refresh records for the patient whose record was just added
        viewPatientAddressInput.value = patientAddress;
        await viewPatientRecords();

    } catch (error) {
        console.error("Error adding record:", error);
        let errorMessage = "Failed to add record. See console for details.";
        if (error.code === 4001) {
            errorMessage = "Transaction rejected by user in MetaMask.";
        } else if (error.message.includes("Only Doctors can add records on blockchain")) {
            errorMessage = "Permission Denied: Only registered Doctors can add records on blockchain.";
        } else if (error.message.includes("Target address is not a registered Patient on blockchain")) {
            errorMessage = "Error: The target address is not a registered 'Patient' on blockchain.";
        }
        showMessage(errorMessage, "error", addRecordMessage);
    }
}

/**
 * @dev Fetches and displays healthcare records for a specified patient, based on current user's role.
 */
async function viewPatientRecords() {
    if (!healthcareRecordsContract || !selectedAccount) {
        showMessage("Smart contract not loaded or account not connected.", "error", viewRecordsMessage);
        return;
    }

    const patientAddress = viewPatientAddressInput.value;

    if (!patientAddress || !web3.utils.isAddress(patientAddress)) {
        showMessage("Please enter a valid patient Ethereum address to view records.", "error", viewRecordsMessage);
        return;
    }

    showMessage("Fetching records from blockchain...", "info", viewRecordsMessage);
    recordsList.innerHTML = ''; // Clear previous records
    noRecordsFound.classList.add('hidden'); // Hide "no records" message

    try {
        let records;
        if (currentUserRole === UserRoleEnum.DrugManufacturer) {
            // Drug Manufacturer uses a specific function to get filtered data
            const drugDetails = await healthcareRecordsContract.methods.getDrugDetailsForManufacturer(patientAddress).call({ from: selectedAccount });
            // The drugDetails will be arrays: [dataHashes, drugUsedList, quantities, causes, timestamps, creators]

            if (drugDetails[0].length === 0) { // Check length of any of the returned arrays
                noRecordsFound.classList.remove('hidden');
                showMessage("No drug-related records found for this patient.", "info", viewRecordsMessage);
                return;
            }

            // Manually reconstruct records for display
            records = [];
            for (let i = 0; i < drugDetails[0].length; i++) {
                records.push({
                    dataHash: drugDetails[0][i], // Keeping dataHash in structure for `displayFilteredRecords`
                    drugUsed: drugDetails[1][i],
                    quantity: drugDetails[2][i],
                    cause: drugDetails[3][i],
                    timestamp: drugDetails[4][i],
                    creator: drugDetails[5][i]
                });
            }
            displayFilteredRecords(records); // Call specialized display for drug manufacturers
            showMessage(`Successfully loaded ${records.length} drug details.`, "success", viewRecordsMessage);

        } else {
            // Other roles (Patient, Doctor, InsuranceCompany) use the general getPatientRecords
            records = await healthcareRecordsContract.methods.getPatientRecords(patientAddress).call({ from: selectedAccount });

            if (records.length === 0) {
                noRecordsFound.classList.remove('hidden');
                showMessage("No records found for this patient.", "info", viewRecordsMessage);
                return;
            }
            displayFullRecords(records); // Call specialized display for full records
            showMessage(`Successfully loaded ${records.length} records.`, "success", viewRecordsMessage);
        }

    } catch (error) {
        console.error("Error viewing records:", error);
        let errorMessage = "Failed to retrieve records. Make sure the address is correct and you have permission.";
        if (error.code === 4001) {
            errorMessage = "Transaction rejected by user in MetaMask.";
        } else if (error.message.includes("Patients can only view their own records")) {
            errorMessage = "Permission Denied: As a Patient, you can only view your own records.";
        } else if (error.message.includes("Your role does not have permission to view full patient records")) {
             errorMessage = "Permission Denied: Your role does not have permission to view full patient records. Try the specific view for your role if available.";
        } else if (error.message.includes("Only Doctors or InsuranceCompanies can view all patient records on blockchain")) {
            errorMessage = "Permission Denied: Only Doctors or InsuranceCompanies can view arbitrary patient records.";
        } else if (error.message.includes("Target address is not a registered Patient on blockchain")) {
            errorMessage = "Error: The target address is not a registered 'Patient' on blockchain.";
        } else if (error.message.includes("Caller is not a registered user on blockchain")) {
            errorMessage = "Permission Denied: You are not registered on the blockchain with this wallet address. Please ensure you signed up with this wallet.";
        } else if (error.message.includes("Caller does not have the required role on blockchain")) {
            errorMessage = "Permission Denied: Your blockchain role does not allow this action.";
        }
        else if (error.message.includes("revert")) {
            errorMessage = "Blockchain reverted transaction: " + error.message;
        }
        showMessage(errorMessage, "error", viewRecordsMessage);
    }
}

/**
 * @dev Displays full patient records (for Doctor, Patient, InsuranceCompany).
 * @param {Array} records An array of PatientRecord structs.
 */
function displayFullRecords(records) {
    recordsList.innerHTML = '';
    records.forEach((record, index) => {
        const recordElement = document.createElement('div');
        recordElement.classList.add('bg-white', 'p-4', 'rounded-lg', 'shadow-sm', 'border', 'border-gray-200');
        const recordDate = new Date(Number(record.timestamp) * 1000); // Convert BigInt to Date
        recordElement.innerHTML = `
            <p class="font-bold text-lg mb-1">Record #${index + 1}</p>
            <p class="text-sm text-gray-700"><strong>Data Hash (IPFS CID):</strong> <a href="https://ipfs.io/ipfs/${record.dataHash}" target="_blank" class="text-blue-500 hover:underline break-all">${record.dataHash}</a></p>
            <p class="text-sm text-gray-700"><strong>Description:</strong> ${record.description}</p>
            <p class="text-sm text-gray-700"><strong>Drug Used:</strong> ${record.drugUsed}</p>
            <p class="text-sm text-gray-700"><strong>Quantity:</strong> ${record.quantity}</p>
            <p class="text-sm text-gray-700"><strong>Cause:</strong> ${record.cause}</p>
            <p class="text-sm text-gray-700"><strong>Added by:</strong> <span class="font-mono text-xs break-all">${record.creator}</span></p>
            <p class="text-sm text-gray-700"><strong>Timestamp:</strong> ${recordDate.toLocaleString()}</p>
        `;
        recordsList.appendChild(recordElement);
    });
}

/**
 * @dev Displays filtered drug details records (for Drug Manufacturer).
 * @param {Array} records An array of simplified record objects.
 */
function displayFilteredRecords(records) {
    recordsList.innerHTML = '';
    records.forEach((record, index) => {
        const recordElement = document.createElement('div');
        recordElement.classList.add('bg-yellow-50', 'p-4', 'rounded-lg', 'shadow-sm', 'border', 'border-yellow-200');
        // No longer display Data Hash, Timestamp, Creator for Drug Manufacturers as per request

        recordElement.innerHTML = `
            <p class="font-bold text-lg mb-1 text-yellow-800">Drug Record #${index + 1}</p>
            <p class="text-sm text-gray-700"><strong>Drug Used:</strong> <span class="font-semibold">${record.drugUsed}</span></p>
            <p class="text-sm text-gray-700"><strong>Quantity:</strong> ${record.quantity}</p>
            <p class="text-sm text-gray-700"><strong>Cause:</strong> ${record.cause}</p>
        `;
        recordsList.appendChild(recordElement);
    });
}

/**
 * @dev Displays messages in a designated message box.
 * @param {string} message The message to display.
 * @param {string} type The type of message (info, success, error, warn).
 * @param {HTMLElement} targetBox The HTML element to display the message in.
 */
function showMessage(message, type = "info", targetBox) {
    const actualTargetBox = targetBox || authMessageBox;

    actualTargetBox.textContent = message;
    actualTargetBox.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-gray-100', 'text-gray-700', 'bg-yellow-100', 'text-yellow-700');

    if (type === "error") {
        actualTargetBox.classList.add('bg-red-100', 'text-red-700');
    } else if (type === "success") {
        actualTargetBox.classList.add('bg-green-100', 'text-green-700');
    } else if (type === "warn") {
        actualTargetBox.classList.add('bg-yellow-100', 'text-yellow-700');
    } else { // info
        actualTargetBox.classList.add('bg-gray-100', 'text-gray-700');
    }
    actualTargetBox.classList.remove('hidden');

    setTimeout(() => {
        actualTargetBox.classList.add('hidden');
    }, 8000);
}
// --- End of public/app.js ---
