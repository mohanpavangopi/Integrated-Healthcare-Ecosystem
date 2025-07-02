const HealthcareRecords = artifacts.require("HealthcareRecords");

module.exports = function (deployer) {
  deployer.deploy(HealthcareRecords);
};
// This migration script deploys the HealthcareRecords contract to the blockchain.
// It uses Truffle's migration system to ensure the contract is deployed correctly.