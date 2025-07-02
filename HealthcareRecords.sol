// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Defines a contract for the Integrated Healthcare Ecosystem
contract HealthcareRecords {

    // --- Enums for User Roles ---
    enum UserRole {
        None,             // Default value for unregistered users
        Patient,
        Doctor,
        DrugManufacturer,
        InsuranceCompany // Renamed from Policymaker
    }

    // --- Structs for Data Storage ---

    // Struct to store user registration details (password hash removed for hybrid approach)
    struct User {
        string username;    // A human-readable username
        UserRole role;      // The assigned role from the UserRole enum
        uint256 registeredAt; // Timestamp of registration
    }

    // Struct to hold a patient's detailed record
    struct PatientRecord {
        address patientAddress; // Ethereum address of the patient this record belongs to
        string dataHash;        // IPFS CID of the actual medical data (e.g., full report)
        string description;     // Brief description of the record (on-chain)
        string drugUsed;        // Specific drug used for this treatment/record
        uint256 quantity;       // Quantity of the drug used
        string cause;           // Cause for which the drug was prescribed/used
        uint256 timestamp;      // Timestamp when the record was added
        address creator;        // Ethereum address of the entity who added this record
    }

    // --- Mappings for State Variables ---

    // Mapping from user's Ethereum address to their User struct
    mapping(address => User) public users;

    // Mapping from a patient's address to an array of their records
    mapping(address => PatientRecord[]) public recordsOfPatient;

    // --- Events ---

    // Event emitted upon successful user registration
    event UserRegistered(address indexed userAddress, string username, UserRole role, uint256 timestamp);

    // Event emitted when a new record is successfully added
    event RecordAdded(
        address indexed patient,
        address indexed creator,
        string dataHash,
        string drugUsed,
        uint256 timestamp
    );

    // --- Modifiers for Access Control ---

    // Checks if the caller is a registered user
    modifier onlyRegisteredUser() {
        require(users[msg.sender].role != UserRole.None, "Caller is not a registered user on blockchain.");
        _;
    }

    // Checks if the caller has a specific role
    modifier onlyRole(UserRole _role) {
        require(users[msg.sender].role == _role, "Caller does not have the required role on blockchain.");
        _;
    }

    // Checks if the caller is a doctor (can add full records)
    modifier onlyDoctor() {
        require(users[msg.sender].role == UserRole.Doctor, "Only Doctors can add records on blockchain.");
        _;
    }

    // --- User Management Functions ---

    /**
     * @dev Registers a new user with a specified role.
     * This function is intended to be called by an *authorized* entity (e.g., your backend)
     * after a user signs up via Firebase Auth. It links the wallet address to a role on-chain.
     * @param _userAddress The Ethereum address of the user being registered.
     * @param _username A string username for the user.
     * @param _role The UserRole enum value for the new user.
     */
    function registerUser(address _userAddress, string memory _username, UserRole _role) public {
        // This function would ideally be called by an authorized backend/admin.
        // For simplicity in this DApp demo, we'll keep it public for now.
        // In a production system, you might add:
        // require(msg.sender == owner, "Only owner can register users");
        // or a different admin role check.

        // Prevent re-registration for the same address
        require(users[_userAddress].role == UserRole.None, "User is already registered on blockchain.");
        // Ensure a valid role is selected
        require(_role != UserRole.None, "Cannot register with 'None' role.");
        require(bytes(_username).length > 0, "Username cannot be empty.");
        require(_userAddress != address(0), "Invalid user address.");


        users[_userAddress] = User({
            username: _username,
            role: _role,
            registeredAt: block.timestamp
        });

        emit UserRegistered(_userAddress, _username, _role, block.timestamp);
    }

    /**
     * @dev Gets the details of a specific user.
     * Used for login verification and displaying user info.
     * @param _userAddress The address of the user to query.
     * @return username The user's username.
     * @return role The user's role (as uint8).
     * @return registeredAt The timestamp of registration.
     */
    function getUser(address _userAddress)
        public
        view
        returns (string memory username, UserRole role, uint256 registeredAt)
    {
        User storage user = users[_userAddress];
        require(user.role != UserRole.None, "User not found or not registered on blockchain.");
        return (user.username, user.role, user.registeredAt);
    }

    /**
     * @dev Gets the role of the caller.
     * @return The UserRole enum value of the caller.
     */
    function getMyRole() public view onlyRegisteredUser() returns (UserRole) {
        return users[msg.sender].role;
    }

    // --- Healthcare Record Management Functions ---

    /**
     * @dev Adds a new detailed healthcare record for a specified patient.
     * Only callable by registered Doctors.
     * @param _patientAddress The Ethereum address of the patient.
     * @param _dataHash The IPFS CID of the full medical data (e.g., full report)
     * @param _description A brief description of the record.
     * @param _drugUsed The name of the drug used.
     * @param _quantity The quantity of the drug used.
     * @param _cause The cause for which the drug was prescribed.
     */
    function addRecord(
        address _patientAddress,
        string memory _dataHash,
        string memory _description,
        string memory _drugUsed,
        uint256 _quantity,
        string memory _cause
    ) public onlyDoctor() { // Only Doctors can add full records on blockchain
        require(bytes(_dataHash).length > 0, "Data hash cannot be empty.");
        require(_patientAddress != address(0), "Invalid patient address.");
        require(users[_patientAddress].role == UserRole.Patient, "Target address is not a registered Patient on blockchain.");
        require(bytes(_drugUsed).length > 0, "Drug used cannot be empty.");
        require(_quantity > 0, "Quantity must be greater than zero.");
        require(bytes(_cause).length > 0, "Cause cannot be empty.");

        PatientRecord memory newRecord = PatientRecord({
            patientAddress: _patientAddress,
            dataHash: _dataHash,
            description: _description,
            drugUsed: _drugUsed,
            quantity: _quantity,
            cause: _cause,
            timestamp: block.timestamp,
            creator: msg.sender
        });

        recordsOfPatient[_patientAddress].push(newRecord);

        emit RecordAdded(_patientAddress, msg.sender, _dataHash, _drugUsed, block.timestamp);
    }

    /**
     * @dev Retrieves all healthcare records for a specific patient, with role-based access.
     * - Patients can only view their own records.
     * - Doctors and InsuranceCompanies can view any patient's full records.
     * - Drug Manufacturers can NOT use this function to view full records; they have a dedicated function for drug details.
     * @param _patientAddress The Ethereum address of the patient.
     * @return An array of PatientRecord structs associated with the given patient.
     */
    function getPatientRecords(address _patientAddress)
        public
        view
        onlyRegisteredUser() // Only registered users can attempt to view records
        returns (PatientRecord[] memory)
    {
        UserRole callerRole = users[msg.sender].role;

        // Check if the target is a registered patient
        require(users[_patientAddress].role == UserRole.Patient, "Target address is not a registered Patient on blockchain.");

        if (callerRole == UserRole.Patient) {
            // Patient can only view their own records
            require(msg.sender == _patientAddress, "Patients can only view their own records.");
        } else if (callerRole == UserRole.Doctor || callerRole == UserRole.InsuranceCompany) { // Updated here
            // Doctors and InsuranceCompanies can view any patient's records
            // No additional check needed beyond being a registered user with these roles
        } else {
            // Drug Manufacturers and other non-viewing roles are explicitly rejected here
            revert("Your role does not have permission to view full patient records.");
        }

        return recordsOfPatient[_patientAddress];
    }

    /**
     * @dev Retrieves drug-specific details from all records for a patient.
     * This function is specifically for Drug Manufacturers.
     * @param _patientAddress The Ethereum address of the patient.
     * @return dataHashes An array of IPFS CIDs for the medical data.
     * @return drugUsedList An array of drug names used.
     * @return quantities An array of drug quantities.
     * @return causes An array of causes/diagnoses.
     * @return timestamps An array of timestamps when records were added.
     * @return creators An array of addresses of the creators.
     */
    function getDrugDetailsForManufacturer(address _patientAddress)
        public
        view
        onlyRole(UserRole.DrugManufacturer) // Only Drug Manufacturers can call this
        returns (string[] memory dataHashes, string[] memory drugUsedList, uint256[] memory quantities, string[] memory causes, uint256[] memory timestamps, address[] memory creators)
    {
        require(users[_patientAddress].role == UserRole.Patient, "Target address is not a registered Patient on blockchain.");

        PatientRecord[] storage patientRecords = recordsOfPatient[_patientAddress];

        dataHashes = new string[](patientRecords.length);
        drugUsedList = new string[](patientRecords.length);
        quantities = new uint256[](patientRecords.length);
        causes = new string[](patientRecords.length);
        timestamps = new uint256[](patientRecords.length);
        creators = new address[](patientRecords.length);

        for (uint i = 0; i < patientRecords.length; i++) {
            PatientRecord storage record = patientRecords[i];
            dataHashes[i] = record.dataHash;
            drugUsedList[i] = record.drugUsed;
            quantities[i] = record.quantity;
            causes[i] = record.cause;
            timestamps[i] = record.timestamp;
            creators[i] = record.creator;
        }

        return (dataHashes, drugUsedList, quantities, causes, timestamps, creators);
    }
}
