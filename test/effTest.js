// TO-DO: test excluded address cutoff

var { ethers } = require("hardhat");
var { expect } = require("chai");
var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { setUpSmartContracts } = require("./effFixtures");
const {
  impersonateAccount,
  setBalance,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

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
    let EfficiencyManager;
    let EfficiencyManagerAddress;

    let votium;
    var votiumAddress = "0x63942E31E98f1833A234077f47880A66136a2D1e";
    // accounts
    let signers = {};


    var minter = "0x1Be14811A3a06F6aF4fA64310a636e1Df04c1c21";



    before(async function () {
        ({ yb, dao, vesting, votium, DepositPlatformDivider, DepositHelperVotium, DepositHelperVoteMarket, EfficiencyManager } = await loadFixture(setUpSmartContracts));
        ybAddress = await yb.getAddress();
        daoAddress = await dao.getAddress();
        vestingAddress = await vesting.getAddress();
        dividerAddress = await DepositPlatformDivider.getAddress();
        helperVotiumAddress = await DepositHelperVotium.getAddress();
        helperVoteMarketAddress = await DepositHelperVoteMarket.getAddress();
        tommyAddress = "0xdC7C7F0bEA8444c12ec98Ec626ff071c6fA27a19";
        votiAddress = "0xe39b8617D571CEe5e75e1EC6B2bb40DdC8CF6Fa3";
        EfficiencyManagerAddress = await EfficiencyManager.getAddress();


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



    describe("test", function () {

        it("should calc latest efficiency", async () => {
            var result = await EfficiencyManager.calcEfficiency();
            console.log(result);
        });

        it("should calc average", async () => {
            var result = await EfficiencyManager.calcAveraged();
            console.log(result);
        });

        it("Should have DAO set EfficiencyManager as PlatformDividerManager", async () => {
            expect(await DepositPlatformDivider.connect(signers.dao).setManager(EfficiencyManagerAddress)).to.be.not.reverted;
            expect(await DepositPlatformDivider.manager()).to.be.equal(EfficiencyManagerAddress);
        });

        it("should set weights", async () => {
            expect(await EfficiencyManager.updateWeights()).to.be.not.reverted;
            var newWeights = await DepositPlatformDivider.getCurrentWeights();
            console.log(newWeights);
        });
    });

});