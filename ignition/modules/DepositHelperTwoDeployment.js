const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployDepositHelperTwo", (m) => {
  // First testing account
  const owner = m.getAccount(0);


  //constructor(address _rewardToken, address _rewardNotifier, address _owner)

  const rewardToken = m.getParameter("_rewardToken", "0x01791F726B4103694969820be083196cC7c045fF");
  const rewardNotifier = m.getParameter("_rewardNotifier", ethers.ZeroAddress);
  const initialOwner = m.getParameter("_owner", "0x40907540d8a6C65c637785e8f8B742ae6b0b9968");


  // DepositHelperTwo constructor has three arguments
  const DepositHelperTwo = m.contract("DepositHelperVotium", [rewardToken, rewardNotifier, initialOwner]);

  return { DepositHelperTwo };
});