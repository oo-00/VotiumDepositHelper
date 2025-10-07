// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IERC20, SafeERC20 } from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

interface Votium {
    function activeRound() external view returns (uint256);
    function depositUnevenSplitGauges(
        address _token,
        uint256 _round,
        address[] memory _gauges,
        uint256[] calldata _amounts,
        uint256 _maxPerVote,
        address[] calldata _excluded
    ) external;
    function maxExclusions() external view returns (uint256);
}

contract DepositHelper {
    using SafeERC20 for IERC20;
    address public constant DEPOSIT_ADDRESS = 0x63942E31E98f1833A234077f47880A66136a2D1e;
    address public rewardToken;
    address public manager;
    address public rewardNotifier;
    struct CurrentWeights {
        address[] gauges;
        uint16[] weights;
    }
    CurrentWeights private currentWeights; // cannot publicly return struct arrays
    mapping(address => bool) public isApprovedGauge; // gauge => isApproved
    uint16 public constant MAX_GAUGE_WEIGHT = 10000;

    address[] public excludeAddresses; // addresses to exclude from eligibility for rewards

    constructor(address _rewardToken, address _rewardNotifier) {
        manager = msg.sender;
        rewardNotifier = _rewardNotifier;
        rewardToken = _rewardToken;
        IERC20(rewardToken).approve(DEPOSIT_ADDRESS, type(uint256).max);
    }


    modifier onlyManager() {
        require(msg.sender == manager, "!manager");
        _;
    }
    modifier onlyRewardNotifier() {
        require(msg.sender == rewardNotifier, "!notifier");
        _;
    }

    function notifyReward(uint256 _amount) external onlyRewardNotifier {
        require(currentWeights.gauges.length > 0, "!weights");
        IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 assignedAmount = 0;
        uint256[] memory amounts = new uint256[](currentWeights.weights.length);
        for(uint256 i = 0; i < currentWeights.weights.length; i++) {
            if(i == currentWeights.weights.length - 1) {
                amounts[i] = _amount - assignedAmount; // assign remainder to last gauge to prevent dust
                break;
            }
            amounts[i] = (_amount * currentWeights.weights[i]) / MAX_GAUGE_WEIGHT;
            assignedAmount += amounts[i];
        }

        if(excludeAddresses.length > 0) {
            uint256 maxExclusions = Votium(DEPOSIT_ADDRESS).maxExclusions();
            address[] memory exclusions = new address[](excludeAddresses.length > maxExclusions ? maxExclusions : excludeAddresses.length);
            for(uint256 i = 0; i < exclusions.length; i++) {
                exclusions[i] = excludeAddresses[i];
            }
            Votium(DEPOSIT_ADDRESS).depositUnevenSplitGauges(
                rewardToken,
                Votium(DEPOSIT_ADDRESS).activeRound(),
                currentWeights.gauges,
                amounts,
                0,
                exclusions
            );
            return;
        }

        Votium(DEPOSIT_ADDRESS).depositUnevenSplitGauges(
            rewardToken,
            Votium(DEPOSIT_ADDRESS).activeRound(),
            currentWeights.gauges,
            amounts,
            0,
            new address[](0)
        );
    }

    function getCurrentWeights() external view returns (address[] memory, uint16[] memory) {
        return (currentWeights.gauges, currentWeights.weights);
    }

    function currentWeightOfGauge(address _gauge) public view returns (uint16) {
        for (uint256 i = 0; i < currentWeights.gauges.length; i++) {
            if (currentWeights.gauges[i] == _gauge) {
                return currentWeights.weights[i];
            }
        }
        return 0;
    }

    // Management configuration

    /**
     * @notice Set the current weights to apply rewards to gauges
     * @param _gauges The list of gauge addresses (MUST BE SORTED ASCENDING)
     * @param _weights The list of weights to apply to each gauge, in same order
     * @dev To prevent duplicates, gauges must be passed in ascending order
     * @dev Total weights must equal 10000 (100.00%)
     * @dev All gauges must be pre-approved with addApprovedGauge()
     */
    function setWeights(address[] memory _gauges, uint16[] memory _weights) external onlyManager {
        require(_gauges.length == _weights.length, "!lengths");
        uint16 totalWeight = 0;
        uint160 addressHeight;
        for(uint256 i = 0; i < _gauges.length; i++) {
            require(isApprovedGauge[_gauges[i]], "!approved");
            uint160 height = uint160(_gauges[i]);
            require(height > addressHeight, "!sorted");
            require(_weights[i] > 0, "!zero");
            addressHeight = height;
            totalWeight += _weights[i];
        }
        require(totalWeight == MAX_GAUGE_WEIGHT, "!10000");
        currentWeights = CurrentWeights({
            gauges: _gauges,
            weights: _weights
        });
    }

    /**
     * @notice Exclusions are limited to Votium max exclusions. Deposits will use only what is allowed by Votium.
     * @param _excludeAddresses The list of addresses to exclude from rewards
     * @dev List will be used in order given, up to Votium max exclusions at time of deposit
     */
    function setExcludeAddresses(address[] memory _excludeAddresses) external onlyManager {
        excludeAddresses = _excludeAddresses;
    }

    function setManager(address _manager) external onlyManager {
        manager = _manager;
    }
    function setRewardToken(address _rewardToken) external onlyManager {
        // remove previous approval
        IERC20(rewardToken).approve(DEPOSIT_ADDRESS, 0);
        // set new token and approve
        rewardToken = _rewardToken;
        IERC20(rewardToken).approve(DEPOSIT_ADDRESS, type(uint256).max);
    }
    function setRewardNotifier(address _rewardNotifier) external onlyManager {
        rewardNotifier = _rewardNotifier;
    }
    function addApprovedGauge(address _gauge) external onlyManager {
        isApprovedGauge[_gauge] = true;
    }
    function removeApprovedGauge(address _gauge) external onlyManager {
        require(currentWeightOfGauge(_gauge) == 0, "!zero");
        isApprovedGauge[_gauge] = false;
    }

    // Execute function for fallback use cases
    function execute(address to, uint256 value, bytes calldata data) external onlyManager returns (bytes memory) {
        (bool success, bytes memory result) = to.call{value:value}(data);
        require(success, "Call failed");
        return result;
    }
}