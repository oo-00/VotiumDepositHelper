var { ethers } = require("hardhat");
const {
  impersonateAccount,
  setBalance,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

var DepositPlatformDividerModule = require("../ignition/modules/DepositPlatformDividerDeployment");
var DepositHelperVotiumModule = require("../ignition/modules/DepositHelperVotiumDeployment");
var DepositHelperTwoModule = require("../ignition/modules/DepositHelperTwoDeployment");
 
async function ybSetUp() {
    var yb;
    var ybAddress = "0x01791F726B4103694969820be083196cC7c045fF";
    var ybAbi = [
        "function transfer(address to, uint256 value) external returns (bool)",
        "function approve(address spender, uint256 value) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function emit(address owner, uint256 rate_factor) external returns (uint256)",
        "function owner() external view returns (address)",
        "function start_emissions() external",
        "function last_minted() external view returns (uint256)",
    ];
    yb = new ethers.Contract(ybAddress, ybAbi, ethers.provider);
    return yb;
}

async function daoSetUp() {
    var dao;
    var daoAddress = "0x40907540d8a6C65c637785e8f8B742ae6b0b9968";
    var daoAbi = [
        "function execute(address _target, uint256 _ethValue, bytes calldata _data) external"
    ];
    dao = new ethers.Contract(daoAddress, daoAbi, ethers.provider);
    return dao;
}

async function vestingSetUp() {
    var vesting;
    var vestingAddress = "0x36e36D5D588D480A15A40C7668Be52D36eb206A8";
    var vestingAbi = [
        "function set_recipient(address _recipient) external",
        "function start() external",
        "function recipient() external view returns (address)",
        "function claimable() external view returns (uint256)",
    ];
    vesting = new ethers.Contract(vestingAddress, vestingAbi, ethers.provider);
    return vesting;
}
/*
address token; uint256 amount; uint256 maxPerVote; uint256 distributed; uint256 recycled; address depositor; address[] excluded;
        */
async function votiumSetUp() {
    var votium;
    var votiumAddress = "0x63942E31E98f1833A234077f47880A66136a2D1e";
    var votiumAbi = [
        "function activeRound() external view returns (uint256)",
        "function incentivesLength(uint256 _round, address _gauge) external view returns (uint256)",
        "function viewIncentive(uint256 _round, address _gauge, uint256 _incentive) external view returns (tuple(address token, uint256 amount, uint256 maxPerVote, uint256 distributed, uint256 recycled, address depositor, address[] excluded))",
        "function tokenAllowed(address _token) external view returns (bool)",
        "function allowToken(address _token, bool _allow) external",
    ];
    votium = new ethers.Contract(votiumAddress, votiumAbi, ethers.provider);
    return votium;
}


async function setUpSmartContracts() {
    // The first testing account or from the array 'accounts'
    const [owner] = await ethers.getSigners();

    var yb = await ybSetUp();
    var rewardTokenAddress = await yb.getAddress();

    var dao = await daoSetUp();
    var daoAddress = await dao.getAddress();

    var vesting = await vestingSetUp();
    var vestingAddress = await vesting.getAddress();

    var votium = await votiumSetUp();

    // DepositPlatformDivider deployment
    const { DepositPlatformDivider } = await ignition.deploy(DepositPlatformDividerModule, {
    parameters: {
        DeployDepositPlatformDivider: {
        _rewardToken: rewardTokenAddress,
        _vesting: vestingAddress,
        _owner: daoAddress,
        },
    },
    });

    var dividerAddress = await DepositPlatformDivider.getAddress();

    // DepositHelperVotium deployment
    const { DepositHelperVotium } = await ignition.deploy(DepositHelperVotiumModule, {
        parameters: {
            DeployDepositHelperVotium: {
                _rewardToken: rewardTokenAddress,
                _rewardNotifier: dividerAddress,
                _owner: daoAddress,
            },
        },
    });

        // copy of DepositHelperVotium deployment
    const { DepositHelperTwo } = await ignition.deploy(DepositHelperTwoModule, {
        parameters: {
            DeployDepositHelperTwo: {
                _rewardToken: rewardTokenAddress,
                _rewardNotifier: dividerAddress,
                _owner: daoAddress,
            },
        },
    });

    return { yb, dao, vesting, votium, DepositPlatformDivider, DepositHelperVotium, DepositHelperTwo };
}
module.exports = { setUpSmartContracts };