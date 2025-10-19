// TO-DO: test excluded address cutoff

var { ethers } = require("hardhat");
var { expect } = require("chai");
var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { setUpSmartContracts } = require("./postDeployFixtures");
const {
  impersonateAccount,
  setBalance,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const DepositHelperVotiumDeployment = require("../ignition/modules/DepositHelperVotiumDeployment");

describe("Setup", function () {

    // contracts and addresses
    let yb;
    let ybAddress;
    let dao;
    let daoAddress;
    let vesting;
    let vestingAddress;
    let DepositPlatformDivider;
    let dividerAddress;

    let votium;
    var votiumAddress = "0x63942E31E98f1833A234077f47880A66136a2D1e";
    // accounts
    let signers = {};


    var minter = "0x1Be14811A3a06F6aF4fA64310a636e1Df04c1c21";



    before(async function () {
        ({ yb, dao, vesting, votium, DepositPlatformDivider, DepositHelperVotium, DepositHelperVoteMarket } = await loadFixture(setUpSmartContracts));
        ybAddress = await yb.getAddress();
        daoAddress = await dao.getAddress();
        vestingAddress = await vesting.getAddress();
        dividerAddress = await DepositPlatformDivider.getAddress();
        helperVotiumAddress = await DepositHelperVotium.getAddress();
        helperVoteMarketAddress = await DepositHelperVoteMarket.getAddress();
        tommyAddress = "0xdC7C7F0bEA8444c12ec98Ec626ff071c6fA27a19";
        votiAddress = "0xe39b8617D571CEe5e75e1EC6B2bb40DdC8CF6Fa3";


        await impersonateAccount(helperVoteMarketAddress);
        signers.helperVoteMarket = await ethers.getSigner(helperVoteMarketAddress);
        await setBalance(helperVoteMarketAddress, ethers.toBigInt("10000000000000000000"));

        await impersonateAccount(minter);
        signers.minter = await ethers.getSigner(minter);
        await setBalance(minter, ethers.toBigInt("10000000000000000000"));

        await impersonateAccount(daoAddress);
        signers.dao = await ethers.getSigner(daoAddress);
        await setBalance(daoAddress, ethers.toBigInt("10000000000000000000"));

        const ybOwner = await yb.owner();
        await impersonateAccount(ybOwner);
        signers.ybOwner = await ethers.getSigner(ybOwner);
        await setBalance(ybOwner, ethers.toBigInt("10000000000000000000"));

        await impersonateAccount("0xdC7C7F0bEA8444c12ec98Ec626ff071c6fA27a19");
        signers.tommy = await ethers.getSigner("0xdC7C7F0bEA8444c12ec98Ec626ff071c6fA27a19");
        await setBalance("0xdC7C7F0bEA8444c12ec98Ec626ff071c6fA27a19", ethers.toBigInt("10000000000000000000"));

        await impersonateAccount("0xe39b8617D571CEe5e75e1EC6B2bb40DdC8CF6Fa3");
        signers.voti = await ethers.getSigner("0xe39b8617D571CEe5e75e1EC6B2bb40DdC8CF6Fa3");
        await setBalance("0xe39b8617D571CEe5e75e1EC6B2bb40DdC8CF6Fa3", ethers.toBigInt("10000000000000000000"));

    });


    describe("Onchain 3rd party actions", function () {
        it("should set the receiver correctly", async () => {
            // set recipient of vesting to be the DepositPlatformDivider
            await vesting.connect(signers.dao).set_recipient(dividerAddress);
            expect(await vesting.recipient()).to.be.equal(dividerAddress);
        });
        it("should have some claimable yb in vesting", async () => {
            var claimable = await vesting.claimable();
            expect(claimable).to.be.gt(0);
        });
    });


    describe("Claim test", function () {

        it("should claim and distribute rewards correctly", async () => {
            // current chain id
            var chainId = await ethers.provider.getNetwork().then((n) => n.chainId);
            console.log("Chain ID: " + chainId);
            // current block number
            var blockheight = await ethers.provider.getBlockNumber();
            console.log(blockheight);
            // check initial balances of votium
            var votiumBalance1 = await yb.balanceOf(votiumAddress);
            expect(votiumBalance1).to.be.equal(0);
            await DepositPlatformDivider.connect(signers.minter).claim();
            // check votium balance again
            var votiumBalance2 = await yb.balanceOf(votiumAddress);
            var diff = votiumBalance2 - votiumBalance1;
            expect(votiumBalance2).to.be.gt(votiumBalance1);
            var vestingClaimable = await vesting.claimable();
            expect(vestingClaimable).to.be.equal(0);
            console.log(vestingClaimable);
            var VoteMarketLastReward = await DepositHelperVoteMarket.getRewardByIndex(0);
            console.log(VoteMarketLastReward);

            var VotiumLastReward = await DepositHelperVotium.getRewardByIndex(0);
            console.log(VotiumLastReward)
        });
    });

    describe("Claim test next epoch", function () {

        it("should claim and distribute rewards correctly", async () => {
            // advance time 1 week
            await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]); // 7 days
            await ethers.provider.send("evm_mine"); // mine the next block


            var callData = "0xf1fb05e9"+"0000000000000000000000001be14811a3a06f6af4fa64310a636e1df04c1c21"+"00000000000000000000000000000000000000000000000000C7230489E80000";
            // use callData on yb contract signed by minter
            await ethers.provider.send("eth_sendTransaction", [
                {
                    from: minter,
                    to: ybAddress,
                    data: callData,
                    gasLimit: 1000000,
                },
            ]);
            await ethers.provider.send("evm_mine"); // mine the next block

            // current chain id
            var chainId = await ethers.provider.getNetwork().then((n) => n.chainId);
            console.log("Chain ID: " + chainId);
            // current block number
            var blockheight = await ethers.provider.getBlockNumber();
            console.log(blockheight);
            // check initial balances of votium
            var votiumBalance1 = await yb.balanceOf(votiumAddress);
            var vestingClaimableBefore = await vesting.claimable();
            console.log(vestingClaimableBefore);
            await DepositPlatformDivider.connect(signers.minter).claim();
            // check votium balance again
            var votiumBalance2 = await yb.balanceOf(votiumAddress);
            var diff = votiumBalance2 - votiumBalance1;
            expect(votiumBalance2).to.be.gt(votiumBalance1);
            var vestingClaimable = await vesting.claimable();
            expect(vestingClaimable).to.be.equal(0);
            console.log(vestingClaimable);
            var VoteMarketLastReward = await DepositHelperVoteMarket.getRewardByIndex(0);
            console.log(VoteMarketLastReward);

            var VotiumLastReward = await DepositHelperVotium.getRewardByIndex(0);
            console.log(VotiumLastReward)
        });
    });
});