const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployDepositPlatformDivider", (m) => {
  // First testing account
  const owner = m.getAccount(0);

  const rewardToken = m.getParameter("_rewardToken", "0x01791F726B4103694969820be083196cC7c045fF");
  const vesting = m.getParameter("_vesting", "0x36e36D5D588D480A15A40C7668Be52D36eb206A8");
  const initialOwner = m.getParameter("_owner", "0x40907540d8a6C65c637785e8f8B742ae6b0b9968");


  // DepositPlatformDivider constructor has three arguments
  const DepositPlatformDivider = m.contract("DepositPlatformDivider", [rewardToken, vesting, initialOwner]);

  return { DepositPlatformDivider };
});