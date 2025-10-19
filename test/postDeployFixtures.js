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
        "function setMaxExclusions(uint256 _max) external",
    ];
    votium = new ethers.Contract(votiumAddress, votiumAbi, ethers.provider);
    return votium;
}

async function depositDividerSetUp() {
    var divider;
    var dividerAddress = "0x1DbA3180458f8791c077102375Ad2623756943e8";
    var dividerAbi = [
        "function getRewardToken() external view returns (address)",
        "function getVesting() external view returns (address)",
        "function getOwner() external view returns (address)",
        "function claim() external",
    ];
    divider = new ethers.Contract(dividerAddress, dividerAbi, ethers.provider);
    return divider;
}

async function depositHelperVotiumSetUp() {
    var helperVotium;
    var helperVotiumAddress = "0x0E190deC1D74005b5a135B26D04E283751A62f8D";
    var helperVotiumAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_rewardToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_rewardNotifier",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "SafeERC20FailedOperation",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "gauge",
          "type": "address"
        }
      ],
      "name": "AddedGauge",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "gauge",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "round",
          "type": "uint256"
        }
      ],
      "name": "DepositForGauge",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "manager",
          "type": "address"
        }
      ],
      "name": "NewManager",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "rewardNotifier",
          "type": "address"
        }
      ],
      "name": "NewRewardNotifier",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "rewardToken",
          "type": "address"
        }
      ],
      "name": "NewRewardToken",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "Notified",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "gauge",
          "type": "address"
        }
      ],
      "name": "RemovedGauge",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address[]",
          "name": "excludeAddresses",
          "type": "address[]"
        }
      ],
      "name": "UpdatedExclusions",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address[]",
          "name": "gauges",
          "type": "address[]"
        },
        {
          "indexed": false,
          "internalType": "uint16[]",
          "name": "weights",
          "type": "uint16[]"
        }
      ],
      "name": "UpdatedWeights",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "DEPOSIT_ADDRESS",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAX_GAUGE_WEIGHT",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_gauge",
          "type": "address"
        }
      ],
      "name": "addApprovedGauge",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_gauge",
          "type": "address"
        }
      ],
      "name": "currentWeightOfGauge",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "excludeAddresses",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "execute",
      "outputs": [
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCurrentWeights",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        },
        {
          "internalType": "uint16[]",
          "name": "",
          "type": "uint16[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getLastReward",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "gauges",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "amounts",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256",
          "name": "epoch",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_index",
          "type": "uint256"
        }
      ],
      "name": "getRewardByIndex",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "gauges",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "amounts",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256",
          "name": "epoch",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "isApprovedGauge",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "manager",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        }
      ],
      "name": "notifyReward",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_gauge",
          "type": "address"
        }
      ],
      "name": "removeApprovedGauge",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "rewardHistoryLength",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "rewardNotifier",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "rewardToken",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_excludeAddresses",
          "type": "address[]"
        }
      ],
      "name": "setExcludeAddresses",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_manager",
          "type": "address"
        }
      ],
      "name": "setManager",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "setOwner",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_rewardNotifier",
          "type": "address"
        }
      ],
      "name": "setRewardNotifier",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_rewardToken",
          "type": "address"
        }
      ],
      "name": "setRewardToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_gauges",
          "type": "address[]"
        },
        {
          "internalType": "uint16[]",
          "name": "_weights",
          "type": "uint16[]"
        }
      ],
      "name": "setWeights",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
  
  helperVotium = new ethers.Contract(helperVotiumAddress, helperVotiumAbi, ethers.provider);
  return helperVotium;
}

async function depositHelperVoteMarketSetUp() {
    var helperVoteMarket;
    var helperVoteMarketAddress = "0xfD97b14E1d91B82936e35aE7b20dA4FD16C855B1";
    var helperVoteMarketAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_rewardToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_rewardNotifier",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "SafeERC20FailedOperation",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "gauge",
          "type": "address"
        }
      ],
      "name": "AddedGauge",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "gauge",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "round",
          "type": "uint256"
        }
      ],
      "name": "DepositForGauge",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "manager",
          "type": "address"
        }
      ],
      "name": "NewManager",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "rewardNotifier",
          "type": "address"
        }
      ],
      "name": "NewRewardNotifier",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "rewardToken",
          "type": "address"
        }
      ],
      "name": "NewRewardToken",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "Notified",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "gauge",
          "type": "address"
        }
      ],
      "name": "RemovedGauge",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address[]",
          "name": "excludeAddresses",
          "type": "address[]"
        }
      ],
      "name": "UpdatedExclusions",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address[]",
          "name": "gauges",
          "type": "address[]"
        },
        {
          "indexed": false,
          "internalType": "uint16[]",
          "name": "weights",
          "type": "uint16[]"
        }
      ],
      "name": "UpdatedWeights",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "DEPOSIT_ADDRESS",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAX_GAUGE_WEIGHT",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_gauge",
          "type": "address"
        }
      ],
      "name": "addApprovedGauge",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_gauge",
          "type": "address"
        }
      ],
      "name": "currentWeightOfGauge",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "excludeAddresses",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "execute",
      "outputs": [
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCurrentWeights",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        },
        {
          "internalType": "uint16[]",
          "name": "",
          "type": "uint16[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getLastReward",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "gauges",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "amounts",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256",
          "name": "epoch",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_index",
          "type": "uint256"
        }
      ],
      "name": "getRewardByIndex",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "gauges",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "amounts",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256",
          "name": "epoch",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "isApprovedGauge",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "manager",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        }
      ],
      "name": "notifyReward",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_gauge",
          "type": "address"
        }
      ],
      "name": "removeApprovedGauge",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "rewardHistoryLength",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "rewardNotifier",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "rewardToken",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_excludeAddresses",
          "type": "address[]"
        }
      ],
      "name": "setExcludeAddresses",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_manager",
          "type": "address"
        }
      ],
      "name": "setManager",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "setOwner",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_rewardNotifier",
          "type": "address"
        }
      ],
      "name": "setRewardNotifier",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_rewardToken",
          "type": "address"
        }
      ],
      "name": "setRewardToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_gauges",
          "type": "address[]"
        },
        {
          "internalType": "uint16[]",
          "name": "_weights",
          "type": "uint16[]"
        }
      ],
      "name": "setWeights",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]

  helperVoteMarket = new ethers.Contract(helperVoteMarketAddress, helperVoteMarketAbi, ethers.provider);
  return helperVoteMarket;
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

    /*/ DepositPlatformDivider deployment
    const { DepositPlatformDivider } = await ignition.deploy(DepositPlatformDividerModule, {
    parameters: {
        DeployDepositPlatformDivider: {
        _rewardToken: rewardTokenAddress,
        _vesting: vestingAddress,
        _owner: daoAddress,
        },
    },
    });*/

    var DepositPlatformDivider = await depositDividerSetUp();

    var DepositHelperVotium = await depositHelperVotiumSetUp();

    var DepositHelperVoteMarket = await depositHelperVoteMarketSetUp();

    /*/ DepositHelperVotium deployment
    var { DepositHelperVotium } = await ignition.deploy(DepositHelperVotiumModule, {
        parameters: {
            DeployDepositHelperVotium: {
                _rewardToken: rewardTokenAddress,
                _rewardNotifier: dividerAddress,
                _owner: daoAddress,
            },
        },
    });

    

        // copy of DepositHelperVotium deployment
    var { DepositHelperTwo } = await ignition.deploy(DepositHelperTwoModule, {
        parameters: {
            DeployDepositHelperTwo: {
                _rewardToken: rewardTokenAddress,
                _rewardNotifier: dividerAddress,
                _owner: daoAddress,
            },
        },
    });

    var presort1 = await DepositHelperVotium.getAddress();
    var presort2 = await DepositHelperTwo.getAddress();

    if(presort1.toLowerCase() > presort2.toLowerCase()){
        var tempDHV = DepositHelperVotium;
        DepositHelperVotium = DepositHelperTwo;
        DepositHelperTwo = tempDHV;
    }
    /*/
    return { yb, dao, vesting, votium, DepositPlatformDivider, DepositHelperVotium, DepositHelperVoteMarket};
}
module.exports = { setUpSmartContracts };