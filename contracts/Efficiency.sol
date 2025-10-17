
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IDepositHelper } from './IDepositHelper.sol';


interface GaugeController {
    function vote_user_slopes(address, address) external view returns (uint256, uint256, uint256);
}

contract Efficiency {

    address public owner;

    GaugeController public constant GAUGE_CONTROLLER = GaugeController(0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB);

    mapping(address helper => address voter) public helperVoter;
    address[] public helpers;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "!auth");
        _;
    }

    function calcEfficiency() public view returns(address[5] memory _helpers, uint256[5] memory ratePer) {
        uint256 currentEpoch = (block.timestamp / 604800) * 604800;
        for(uint256 i=0;i<helpers.length;++i) {
            (address[] memory gauges, uint256[] memory amounts,) = IDepositHelper(helpers[i]).getLastReward();
            uint256 helperRewardTotal;
            uint256 helperVoteTotal;
            for(uint256 g=0;g<gauges.length;++g) {
                helperRewardTotal += amounts[g];
                (uint256 slope, , uint256 end) = GAUGE_CONTROLLER.vote_user_slopes(helperVoter[helpers[i]], gauges[g]);
                if(slope == 0) { continue; }
                helperVoteTotal += (slope * (end - currentEpoch));
            }
            _helpers[i] = helpers[i];
            ratePer[i] = helperVoteTotal / helperRewardTotal;
        }
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function addHelper(address _helper, address _voter) external onlyOwner {
        helpers.push(_helper);
        helperVoter[_helper] = _voter;
    }

    function removeHelper(address _helper, uint256 _index) external onlyOwner {
        require(helpers[_index] == _helper, "!index");
        helpers[_index] = helpers[helpers.length-1];
        helpers.pop();
    }
}