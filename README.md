# Integrated Healthcare Ecosystem

A decentralized healthcare DApp leveraging **Blockchain** and **MongoDB** to enable secure, transparent, and role-based access to medical records.

---

## 🌐 Overview

**Integrated Healthcare Ecosystem** is a decentralized web application that bridges the gaps in modern healthcare coordination. It combines the immutability and security of **Ethereum blockchain** with the flexibility of **MongoDB** to manage users and medical data effectively. IPFS integration enables off-chain storage of large reports while maintaining blockchain verifiability.

---

## 🌟 Features

- **Secure User Authentication**  
  Email, password, and Ethereum wallet-based login with role management in MongoDB.

- **Role-Based Access Control**
  - **Doctors**: Add and view all patient records (with IPFS hash, drugs, diagnosis).
  - **Patients**: View their own medical history.
  - **Drug Manufacturers**: Access only drug-specific info from patient records.
  - **Insurance Companies**: View full records for claim assessments.

- **Blockchain-Backed Records**  
  Immutable healthcare data storage via smart contracts on Ethereum.

- **IPFS Integration**  
  Link large medical reports securely using Content Identifiers (CIDs).

- **Responsive Dashboard UI**  
  Built using HTML5, Tailwind CSS, and vanilla JS, with modern glassmorphism effects.

---

## 🛠️ Tech Stack

### 🔗 Blockchain
- **Solidity**: Smart Contracts
- **Truffle**: Development Framework
- **Ganache**: Local Blockchain
- **Web3.js**: Frontend Blockchain Interaction

### ⚙️ Backend
- **Node.js + Express**: API & Auth Server
- **MongoDB + Mongoose**: User & Role Management
- **JWT**: Session Authentication
- **Bcrypt.js**: Password Hashing

### 💻 Frontend
- **HTML5 + Tailwind CSS**
- **JavaScript (Vanilla)**
- **MetaMask**: Wallet Integration
- **Font Awesome / Bootstrap Icons**: Visuals

---

## 🚀 Setup Instructions

### 📦 Prerequisites
- Node.js & npm
- Ganache (Desktop or CLI)
- MetaMask Extension
- MongoDB Instance (local or Atlas)

### 📁 Installation
```bash
git clone https://github.com/your-username/integrated-healthcare-ecosystem.git
cd integrated-healthcare-ecosystem
npm install
```

### 🔧 Configure `.env`
```env
MONGO_URI=mongodb://localhost:27017/medchain
GANACHE_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_test_private_key
JWT_SECRET=your_secure_random_key
```

> ⚠️ Use only test accounts for development.

### 🧱 Compile & Deploy Contracts
```bash
truffle compile
truffle migrate --network development --reset
```

Then:
```bash
mkdir -p public/contracts
cp build/contracts/HealthcareRecords.json public/contracts/
```

### 🌐 Start Server
```bash
node server.js
```

Visit `http://localhost:3000` in your browser.

---

## 🧪 Usage Guide

### 👥 Sign Up
- Select role (Doctor / Patient / Manufacturer / Insurance)
- Register with MetaMask connected

### 🔐 Login
- Use registered email and password
- Ensure correct MetaMask account is active

### 💼 Dashboard Access
- Role-specific UI with access control
- Add/view records, IPFS hash, secure interactions

---

## 📁 Project Structure

```
integrated-healthcare-ecosystem/
├── contracts/                  # Solidity Smart Contracts
├── migrations/                # Truffle Deployment Scripts
├── public/                   # Frontend HTML/CSS/JS
│   ├── contracts/            # ABI JSON
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js                 # Express Backend
├── .env
├── package.json
├── truffle-config.js
└── README.md
```

---

## 🔮 Future Improvements

- Actual IPFS upload via Infura or Web3.Storage
- Analytics Dashboard (Chart.js, D3.js)
- Audit logs & real-time notifications
- Multi-factor authentication
- Enhanced mobile design

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> Built with ❤️ for secure and efficient decentralized healthcare.
