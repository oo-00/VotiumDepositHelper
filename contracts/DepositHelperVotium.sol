// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IERC20, SafeERC20 } from './SafeERC20.sol';

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

contract DepositHelperVotium {
    using SafeERC20 for IERC20;
    address public constant DEPOSIT_ADDRESS = 0x63942E31E98f1833A234077f47880A66136a2D1e;
    address public owner;
    address public manager;
    address public rewardToken;
    address public rewardNotifier;

    struct CurrentWeights {
        address[] gauges;
        uint16[] weights;
    }

    struct LastReward {
        address[] gauges;
        uint256[] amounts;
        uint256 epoch;
    }

    CurrentWeights private currentWeights; // cannot publicly return struct arrays
    LastReward[] private lastReward;

    mapping(address => bool) public isApprovedGauge; // gauge => isApproved
    uint16 public constant MAX_GAUGE_WEIGHT = 10000;

    address[] public excludeAddresses; // addresses to exclude from eligibility for rewards

    constructor(address _rewardToken, address _rewardNotifier, address _owner) {
        manager = msg.sender;
        owner = _owner;
        rewardNotifier = _rewardNotifier;
        rewardToken = _rewardToken;
        IERC20(rewardToken).approve(DEPOSIT_ADDRESS, type(uint256).max);
    }


    modifier onlyManager() {
        require(msg.sender == manager || msg.sender == owner, "!auth");
        _;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "!auth");
        _;
    }

    // --- View functions ---

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

    function getLastReward() external view returns (address[] memory gauges, uint256[] memory amounts, uint256 epoch) {
        if(lastReward[lastReward.length - 1].epoch < (block.timestamp / 604800) * 604800) {
            return (lastReward[lastReward.length - 1].gauges, lastReward[lastReward.length - 1].amounts, lastReward[lastReward.length - 1].epoch);
        } else {
            return (lastReward[lastReward.length - 2].gauges, lastReward[lastReward.length - 2].amounts, lastReward[lastReward.length - 2].epoch);
        }
    }

    function getRewardByIndex(uint256 _index) external view returns (address[] memory gauges, uint256[] memory amounts, uint256 epoch) {
        return (lastReward[_index].gauges, lastReward[_index].amounts, lastReward[_index].epoch);
    }

    function rewardHistoryLength() external view returns (uint256) {
        return lastReward.length;
    }

    // --- Main function ---

    // Called by reward notifier (DepositPlatformDivider) to notify rewards and split to gauges
    function notifyReward(uint256 _amount) external {
        require(msg.sender == rewardNotifier, "!notifier");
        require(currentWeights.gauges.length > 0, "!weights");
        IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 votiumRound = Votium(DEPOSIT_ADDRESS).activeRound();

        // split amounts according to weights
        uint256 assignedAmount = 0;
        uint256[] memory amounts = new uint256[](currentWeights.weights.length);
        for(uint256 i = 0; i < currentWeights.weights.length; i++) {
            if(i == currentWeights.weights.length - 1) {
                amounts[i] = _amount - assignedAmount; // assign remainder to last gauge to prevent dust
                emit DepositForGauge(currentWeights.gauges[i], amounts[i], votiumRound);
                break;
            }
            amounts[i] = (_amount * currentWeights.weights[i]) / MAX_GAUGE_WEIGHT;
            emit DepositForGauge(currentWeights.gauges[i], amounts[i], votiumRound);
            assignedAmount += amounts[i];
        }

        // Record last reward for efficiency calculations
        lastReward.push(LastReward({
            gauges: currentWeights.gauges,
            amounts: amounts,
            epoch: (block.timestamp / 604800) * 604800
        }));

        // Handle exclusions if any are set
        if(excludeAddresses.length > 0) {
            uint256 maxExclusions = Votium(DEPOSIT_ADDRESS).maxExclusions();
            address[] memory exclusions = new address[](excludeAddresses.length > maxExclusions ? maxExclusions : excludeAddresses.length);
            for(uint256 i = 0; i < exclusions.length; i++) {
                exclusions[i] = excludeAddresses[i];
            }
            Votium(DEPOSIT_ADDRESS).depositUnevenSplitGauges(
                rewardToken,
                votiumRound,
                currentWeights.gauges,
                amounts,
                0,
                exclusions
            );
            return;
        }
        // No exclusions
        Votium(DEPOSIT_ADDRESS).depositUnevenSplitGauges(
            rewardToken,
            Votium(DEPOSIT_ADDRESS).activeRound(),
            currentWeights.gauges,
            amounts,
            0,
            new address[](0)
        );
    }

    // --- Manager functions ---

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
        emit UpdatedWeights(_gauges, _weights);
    }

    /**
     * @notice Exclusions are limited to Votium max exclusions. Deposits will use only what is allowed by Votium.
     * @param _excludeAddresses The list of addresses to exclude from rewards
     * @dev List will be used in order given, up to Votium max exclusions at time of deposit
     */
    function setExcludeAddresses(address[] memory _excludeAddresses) external onlyManager {
        for(uint256 i = 1; i < _excludeAddresses.length; i++) {
            require(_excludeAddresses[i] > _excludeAddresses[i-1], "!sorted");
        }
        excludeAddresses = _excludeAddresses;
        emit UpdatedExclusions(_excludeAddresses);
    }

    // --- Owner functions ---

    function setManager(address _manager) external onlyOwner {
        manager = _manager;
        emit NewManager(_manager);
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }
    
    function setRewardToken(address _rewardToken) external onlyOwner {
        // remove previous approval
        IERC20(rewardToken).approve(DEPOSIT_ADDRESS, 0);
        // set new token and approve
        rewardToken = _rewardToken;
        IERC20(rewardToken).approve(DEPOSIT_ADDRESS, type(uint256).max);
        emit NewRewardToken(_rewardToken);
    }

    function setRewardNotifier(address _rewardNotifier) external onlyOwner {
        rewardNotifier = _rewardNotifier;
        emit NewRewardNotifier(_rewardNotifier);
    }

    function addApprovedGauge(address _gauge) external onlyOwner {
        isApprovedGauge[_gauge] = true;
        emit AddedGauge(_gauge);
    }

    function removeApprovedGauge(address _gauge) external onlyOwner {
        require(currentWeightOfGauge(_gauge) == 0, "!weight");
        isApprovedGauge[_gauge] = false;
        emit RemovedGauge(_gauge);
    }

    function execute(address to, uint256 value, bytes calldata data) external onlyOwner returns (bytes memory) {
        (bool success, bytes memory result) = to.call{value:value}(data);
        require(success, "Call failed");
        return result;
    }

    // --- Events ---
    event Notified(address token, uint256 amount);
    event AddedGauge(address indexed gauge);
    event RemovedGauge(address indexed gauge);
    event UpdatedWeights(address[] gauges, uint16[] weights);
    event NewManager(address manager);
    event NewRewardToken(address rewardToken);
    event NewRewardNotifier(address rewardNotifier);
    event UpdatedExclusions(address[] excludeAddresses);
    event DepositForGauge(address indexed gauge, uint256 amount, uint256 indexed round);
}