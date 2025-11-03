
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IDepositHelper } from './IDepositHelper.sol';


interface GaugeController {
    function vote_user_slopes(address, address) external view returns (uint256, uint256, uint256);
    function get_gauge_weight(address) external view returns (uint256);
}

interface PlatformDivider {
    function setWeights(address[] memory _helpers, uint16[] memory _weights) external;
}

contract EfficiencyManager {

    address public owner;

    GaugeController public constant GAUGE_CONTROLLER = GaugeController(0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB);

    PlatformDivider public divider = PlatformDivider(0x0997f89c451124EadF00f87DE77924D77A38419a);
    address public votiumHelper = 0x5005DE019301aB6b744B6EFbB942E9A8999EEeC7;
    address public votemarketHelper = 0xfD97b14E1d91B82936e35aE7b20dA4FD16C855B1;
    address public constant convexVoter = 0x989AEb4d175e16225E39E87d0D97A3360524AD80;

    struct Weights {
        uint256 votium;
        uint256 votemarket;
    }
    Weights[] public weightHistory;
    function weightHistoryLength() public view returns (uint256) {
        return weightHistory.length;
    }

    uint256 public lastTimeSet;

    uint256 public averagingLength = 1;

    constructor() {
        owner = msg.sender;
        weightHistory.push(Weights(6500,3500));
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "!owner");
        _;
    }

    function calcEfficiency() public view returns(Weights memory weights) {
        uint256 currentEpoch = (block.timestamp / 604800) * 604800;
        (address[] memory gauges, uint256[] memory amountsConvex,) = IDepositHelper(votiumHelper).getLastReward();
        (, uint256[] memory amountsVotemarket,) = IDepositHelper(votiumHelper).getLastReward();
        uint256 votiumRewardTotal;
        uint256 votiumVoteTotal;
        uint256 votemarketRewardTotal;
        uint256 votemarketVoteTotal;
        for(uint256 g=0;g<gauges.length;++g) {
            votiumRewardTotal += amountsConvex[g];
            votemarketRewardTotal += amountsVotemarket[g];
            (uint256 slope, , uint256 end) = GAUGE_CONTROLLER.vote_user_slopes(convexVoter, gauges[g]);
            if(slope == 0) { continue; }
            votiumVoteTotal += (slope * (end - currentEpoch));
            uint256 gaugeTotal = GAUGE_CONTROLLER.get_gauge_weight(gauges[g]);
            votemarketVoteTotal += gaugeTotal - (slope * (end - currentEpoch));
        }
        uint256 votiumEff = votiumVoteTotal / votiumRewardTotal;
        uint256 votemarketEff = votemarketVoteTotal / votemarketRewardTotal;
        uint256 outOf = votiumEff+votemarketEff;
        weights.votium = votiumEff*10000/outOf;
        weights.votemarket = 10000-weights.votium;
    }

    function latestWeight() external view returns (Weights memory) {
        require(weightHistory.length > 0, "No history");
        return weightHistory[weightHistory.length - 1];
    }

    function lastNWeightsSum(uint256 n) public view returns (Weights memory result) {
        uint256 len = weightHistory.length;
        if (n > len) n = len;
        for (uint256 i = 0; i < n; i++) {
            result.votium += weightHistory[len - n + i].votium;
            result.votemarket += weightHistory[len - n + i].votemarket;
        }
    }

    function calcAveraged() public view returns (Weights memory) {
        Weights memory latestEfficiency = calcEfficiency();
        Weights memory averagingSum = lastNWeightsSum(averagingLength);
        uint256 averaged = (latestEfficiency.votium + averagingSum.votium) / (averagingLength + 1);
        return Weights(averaged, 10000 - averaged);
    }

    function updateWeights() external {
        uint256 currentEpoch = (block.timestamp / 2 weeks) * 2 weeks - 1 weeks;
        require(currentEpoch > lastTimeSet, "!wait");
        Weights memory av;
        if(averagingLength > 0) {
            av = calcAveraged();
        } else {
            av = calcEfficiency();
        }
        weightHistory.push(av);
        address[] memory helpers = new address[](2);
        uint16[] memory weights = new uint16[](2);
        helpers[0] = votiumHelper;
        helpers[1] = votemarketHelper;
        weights[0] = uint16(av.votium);
        weights[1] = uint16(av.votemarket);
        divider.setWeights(helpers, weights);
    }

    function setVotiumHelper(address _helper) external onlyOwner {
        votiumHelper = _helper;
    }
    function setVotemarketHelper(address _helper) external onlyOwner {
        votemarketHelper = _helper;
    }
    function setDivider(address _divider) external onlyOwner {
        divider = PlatformDivider(_divider);
    }
    function setAveragingLength(uint256 _averagingLength) external onlyOwner {
        averagingLength = _averagingLength;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }
}