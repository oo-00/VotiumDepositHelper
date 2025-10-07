// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IERC20, SafeERC20 } from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import { IDepositHelper } from './IDepositHelper.sol';

contract DepositPlatformDivider {
    using SafeERC20 for IERC20;

    uint16 public constant MAX_HELPER_WEIGHT = 10000;
    address public manager;
    address public rewardToken;
    address public rewardNotifier;

    mapping(address => bool) public isApprovedHelper; // helper => isApproved

    struct CurrentWeights {
        address[] helpers;
        uint16[] weights;
    }
    CurrentWeights private currentWeights; // cannot publicly return struct arrays

    

    constructor(address _rewardToken, address _rewardNotifier) {
        manager = msg.sender;
        rewardToken = _rewardToken;
        rewardNotifier = _rewardNotifier;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "!manager");
        _;
    }

    function notifyReward(uint256 _amount) external {
        require(currentWeights.helpers.length > 0, "!weights");
        IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 assignedAmount = 0;
        uint256[] memory amounts = new uint256[](currentWeights.weights.length);
        for(uint256 i = 0; i < currentWeights.weights.length; i++) {
            if(i == currentWeights.weights.length - 1) {
                amounts[i] = _amount - assignedAmount; // assign remainder to last helper to prevent dust
                break;
            }
            amounts[i] = (_amount * currentWeights.weights[i]) / MAX_HELPER_WEIGHT;
            assignedAmount += amounts[i];
        }
        for(uint256 i = 0; i < currentWeights.helpers.length; i++) {
            IDepositHelper(currentWeights.helpers[i]).notifyReward(amounts[i]);
        }
    }

    function getCurrentWeights() external view returns (address[] memory, uint16[] memory) {
        return (currentWeights.helpers, currentWeights.weights);
    }
    function currentWeightOfHelper(address _helper) public view returns (uint16) {
        for(uint256 i = 0; i < currentWeights.helpers.length; i++) {
            if(currentWeights.helpers[i] == _helper) {
                return currentWeights.weights[i];
            }
        }
        return 0;
    }

    function setWeights(address[] memory _helpers, uint16[] memory _weights) external onlyManager {
        require(_helpers.length == _weights.length, "!length");
        uint256 totalWeight = 0;
        for(uint256 i = 0; i < _helpers.length; i++) {
            require(isApprovedHelper[_helpers[i]], "!approved");
            totalWeight += _weights[i];
        }
        require(totalWeight == MAX_HELPER_WEIGHT, "!10000");
        currentWeights.helpers = _helpers;
        currentWeights.weights = _weights;
    }

    function setManager(address _manager) external onlyManager {
        manager = _manager;
    }

    function addDepositHelper(address _depositHelper) external onlyManager {
        isApprovedHelper[_depositHelper] = true;
        IERC20(rewardToken).approve(_depositHelper, type(uint256).max);
    }

    function removeDepositHelper(address _depositHelper) external onlyManager {
        require(currentWeightOfHelper(_depositHelper) == 0, "!zero");
        isApprovedHelper[_depositHelper] = false;
        IERC20(rewardToken).approve(_depositHelper, 0);
    }

    function execute(address to, uint256 value, bytes calldata data) external onlyManager returns (bytes memory) {
        require(to != rewardNotifier, "!unsafe"); // since notifier likely has token approval set for this contract
        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "Call failed");
        return result;
    }
}