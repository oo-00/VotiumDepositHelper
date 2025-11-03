const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployEfficiencyManager", (m) => {

  // EfficiencyManager constructor has no arguments
  const EfficiencyManager = m.contract("EfficiencyManager");

  return { EfficiencyManager };
});