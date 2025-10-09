// TO-DO: test excluded address cutoff

var { ethers } = require("hardhat");
var { expect } = require("chai");
var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { setUpSmartContracts } = require("./fixtures");
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
    let DepositHelperVotium;
    let helperVotiumAddress;
    let DepositHelperTwo;
    let helperTwoAddress;
    let votium;
    var votiumAddress = "0x63942E31E98f1833A234077f47880A66136a2D1e";
    // accounts
    let manager;
    let signers = {};


    var minter = "0x1Be14811A3a06F6aF4fA64310a636e1Df04c1c21";

    var gauge1 = "0x4e6bB6B7447B7B2Aa268C16AB87F4Bb48BF57939";
    var gauge2 = "0x95f00391cB5EebCd190EB58728B4CE23DbFa6ac1";
    var gauge3 = "0x8D867BEf70C6733ff25Cc0D1caa8aA6c38B24817";
    var gauge4 = "0xaF01d68714E7eA67f43f08b5947e367126B889b1";

    var dead = [
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000002",
        "0x0000000000000000000000000000000000000003",
        "0x0000000000000000000000000000000000000004",
        "0x0000000000000000000000000000000000000005",
        "0x0000000000000000000000000000000000000006",
        "0x0000000000000000000000000000000000000007",
        "0x0000000000000000000000000000000000000008",
        "0x0000000000000000000000000000000000000009",
        "0x0000000000000000000000000000000000000010"
    ]

    before(async function () {
        ({ yb, dao, vesting, votium, DepositPlatformDivider, DepositHelperVotium, DepositHelperTwo } = await loadFixture(setUpSmartContracts));
        ybAddress = await yb.getAddress();
        daoAddress = await dao.getAddress();
        vestingAddress = await vesting.getAddress();
        dividerAddress = await DepositPlatformDivider.getAddress();
        helperVotiumAddress = await DepositHelperVotium.getAddress();
        helperTwoAddress = await DepositHelperTwo.getAddress();
        manager = await DepositHelperVotium.manager();
        tommyAddress = "0xdC7C7F0bEA8444c12ec98Ec626ff071c6fA27a19";
        votiAddress = "0xe39b8617D571CEe5e75e1EC6B2bb40DdC8CF6Fa3";

        await impersonateAccount(manager);
        signers.manager = await ethers.getSigner(manager);
        await setBalance(manager, ethers.toBigInt("10000000000000000000"));

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

    describe("Validate Deployment Values", () => {
        it("DepositPlatformDivider address check", async () => {
            expect(await DepositPlatformDivider.rewardToken()).to.be.equal("0x01791F726B4103694969820be083196cC7c045fF");
            expect(await DepositPlatformDivider.VESTING()).to.be.equal("0x36e36D5D588D480A15A40C7668Be52D36eb206A8");
            expect(await DepositPlatformDivider.owner()).to.be.equal("0x40907540d8a6C65c637785e8f8B742ae6b0b9968");
            expect(await DepositPlatformDivider.manager()).to.be.equal(manager);
        });
        it("DepositHelperVotium address check", async () => {
            expect(await DepositHelperVotium.rewardToken()).to.be.equal("0x01791F726B4103694969820be083196cC7c045fF");
            expect(await DepositHelperVotium.rewardNotifier()).to.be.equal(dividerAddress);
            expect(await DepositHelperVotium.owner()).to.be.equal("0x40907540d8a6C65c637785e8f8B742ae6b0b9968");
            expect(await DepositHelperVotium.manager()).to.be.equal(manager);
        });
    });

    describe("Onchain 3rd party actions", function () {
        it("should set the receiver correctly", async () => {
            // set recipient of vesting to be the DepositPlatformDivider
            await vesting.connect(signers.dao).set_recipient(dividerAddress);
            expect(await vesting.recipient()).to.be.equal(dividerAddress);
        });
        it("should start yb emissions", async () => {

            await yb.connect(signers.ybOwner).start_emissions();
            expect(await yb.last_minted()).to.be.gt(0);
        });
        it("should emit some yb tokens", async () => {

            // wait 1 week
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]); // 7 days
            await ethers.provider.send("evm_mine", []);

            // cannot call 'emit' directly because hardhat has an override for 'emit' keyword
            // await yb.connect(signers.minter).emit(minter, rate_factor);
            var callData = "0xf1fb05e9"+"0000000000000000000000001be14811a3a06f6af4fa64310a636e1df04c1c21"+"0000000000000000000000000000000000000000000000000AC7230489E80000";
            // use callData on yb contract signed by minter
            await ethers.provider.send("eth_sendTransaction", [
                {
                    from: minter,
                    to: ybAddress,
                    data: callData,
                    gasLimit: 1000000,
                },
            ]);
            // check balance of minter
            expect(await yb.balanceOf(minter)).to.be.gt(0);
        });
        it("should have some claimable yb in vesting", async () => {
            var claimable = await vesting.claimable();
            expect(claimable).to.be.gt(0);
        });
        it("should set Votium max exclusions to 3", async () => {
            await expect(votium.connect(signers.voti).setMaxExclusions(3)).to.not.be.reverted;
        });
    });

    describe("Setup Functions", function () {
        describe("Divider Config", function () {
            it("should fail before helpers/weights are set", async () => {
                await expect(DepositPlatformDivider.claim()).to.be.revertedWith("!weights");
            });
            it("should fail to set weights before DAO approves helper", async () => {
                await expect(DepositPlatformDivider.connect(signers.manager).setWeights([helperVotiumAddress],[10000])).to.be.revertedWith("!approved");
            });
            it("should not allow manager to approve helper", async () => {
                await expect(DepositPlatformDivider.connect(signers.manager).addDepositHelper(helperVotiumAddress)).to.be.revertedWith("!auth");
            });
            it("should allow DAO to approve DepositHelperVotium as helper", async () => {
                await setBalance(daoAddress, ethers.toBigInt("10000000000000000000"));
                await DepositPlatformDivider.connect(signers.dao).addDepositHelper(helperVotiumAddress);
                expect(await DepositPlatformDivider.isApprovedHelper(helperVotiumAddress)).to.be.equal(true);
            });
            it("should allow DAO to approve DepositHelperTwo as helper", async () => {
                await DepositPlatformDivider.connect(signers.dao).addDepositHelper(helperTwoAddress);
                expect(await DepositPlatformDivider.isApprovedHelper(helperTwoAddress)).to.be.equal(true);
            });
            it("should fail if total weight is under 10000", async () => {
                await expect(DepositPlatformDivider.setWeights([helperVotiumAddress],[9999])).to.be.revertedWith("!10000");
            });
            it("should fail if total weight is over 10000", async () => {
                await expect(DepositPlatformDivider.setWeights([helperVotiumAddress],[10001])).to.be.revertedWith("!10000");
            });
            it("should not allow duplicate helper provided for weights", async() => {
                await expect(DepositPlatformDivider.setWeights([helperVotiumAddress, helperVotiumAddress],[8000, 2000])).to.be.revertedWith("!sorted");
            });
            it("should set weights correctly (still as DAO)", async () => {
                await DepositPlatformDivider.setWeights([helperVotiumAddress, helperTwoAddress],[8000, 2000]);
                expect(await DepositPlatformDivider.currentWeightOfHelper(helperVotiumAddress)).to.be.equal(8000);
                expect(await DepositPlatformDivider.currentWeightOfHelper(helperTwoAddress)).to.be.equal(2000);
            });
            it("should allow manager to change weights", async () => {
                await DepositPlatformDivider.connect(signers.manager).setWeights([helperVotiumAddress, helperTwoAddress],[7000, 3000]);
                expect(await DepositPlatformDivider.currentWeightOfHelper(helperVotiumAddress)).to.be.equal(7000);
                expect(await DepositPlatformDivider.currentWeightOfHelper(helperTwoAddress)).to.be.equal(3000);
            });
            it("should not allow anyone else to change weights", async () => {
                await expect(DepositPlatformDivider.connect(signers.minter).setWeights([helperVotiumAddress, helperTwoAddress],[6000, 4000])).to.be.revertedWith("!auth");
            });
            it("should not allow helper to be removed if it has weight", async () => {
                await expect(DepositPlatformDivider.connect(signers.dao).removeDepositHelper(helperVotiumAddress)).to.be.revertedWith("!weight");
            });
            it("should allow helper to be removed if weight is 0", async () => {
                await DepositPlatformDivider.setWeights([helperVotiumAddress],[10000]);
                expect(await DepositPlatformDivider.currentWeightOfHelper(helperVotiumAddress)).to.be.equal(10000);
                expect(await DepositPlatformDivider.currentWeightOfHelper(helperTwoAddress)).to.be.equal(0);
                await DepositPlatformDivider.connect(signers.dao).removeDepositHelper(helperTwoAddress);
                expect(await DepositPlatformDivider.isApprovedHelper(helperTwoAddress)).to.be.equal(false);
            });
            it("should re-add helperTwo", async () => {
                await DepositPlatformDivider.connect(signers.dao).addDepositHelper(helperTwoAddress);
                expect(await DepositPlatformDivider.isApprovedHelper(helperTwoAddress)).to.be.equal(true);
                await DepositPlatformDivider.setWeights([helperVotiumAddress, helperTwoAddress],[7000, 3000]);
                expect(await DepositPlatformDivider.currentWeightOfHelper(helperVotiumAddress)).to.be.equal(7000);
                expect(await DepositPlatformDivider.currentWeightOfHelper(helperTwoAddress)).to.be.equal(3000);
            });
            it("should not allow a weight to be set to 0 except by omission", async () => {
                await expect(DepositPlatformDivider.connect(signers.manager).setWeights([helperVotiumAddress, helperTwoAddress],[10000, 0])).to.be.revertedWith("!zero");
            });
            it("should fail before helpers are configured", async () => {
                await expect(DepositPlatformDivider.claim()).to.be.revertedWith("!weights");
            });
        });
        describe("Helper Config", function () {
            it("should fail to set weights before dao approves gauges", async () => {
                await expect(DepositHelperVotium.setWeights([gauge1],[10000])).to.be.revertedWith("!approved");
            });
            it("should not allow manager to approve gauge", async () => {
                await expect(DepositHelperVotium.connect(signers.manager).addApprovedGauge(gauge1)).to.be.revertedWith("!auth");
            });
            it("should allow DAO to approve gauges on DepositHelperVotium", async () => {
                await DepositHelperVotium.connect(signers.dao).addApprovedGauge(gauge1);
                expect(await DepositHelperVotium.isApprovedGauge(gauge1)).to.be.equal(true);
                await DepositHelperVotium.connect(signers.dao).addApprovedGauge(gauge2);
                expect(await DepositHelperVotium.isApprovedGauge(gauge2)).to.be.equal(true);
            });
            it("should not allow public to set weights", async () => {
                expect(DepositHelperVotium.connect(signers.minter).setWeights([gauge1],[10000])).to.be.revertedWith("!auth");
            });
            it("should fail if total weight is under 10000", async () => {
                await expect(DepositHelperVotium.connect(signers.manager).setWeights([gauge1],[9999])).to.be.revertedWith("!10000");
            });
            it("should fail if total weight is over 10000", async () => {
                await expect(DepositHelperVotium.connect(signers.manager).setWeights([gauge1],[10001])).to.be.revertedWith("!10000");
            });
            it("should not allow weights to have different length to gauges", async () => {
                await expect(DepositHelperVotium.connect(signers.manager).setWeights([gauge1, gauge2],[10000])).to.be.revertedWith("!lengths");
            });
            it("should not allow duplicate gauge provided", async() => {
                await expect(DepositHelperVotium.connect(signers.manager).setWeights([gauge1, gauge1],[5000, 5000])).to.be.revertedWith("!sorted");
            })
            it("should set weights correctly (as manager)", async () => {
                await DepositHelperVotium.connect(signers.manager).setWeights([gauge1, gauge2],[6000, 4000]);
                expect(await DepositHelperVotium.currentWeightOfGauge(gauge1)).to.be.equal(6000);
                expect(await DepositHelperVotium.currentWeightOfGauge(gauge2)).to.be.equal(4000);
            });
            it("should not allow gauge to be removed if it has weight", async () => {
                await expect(DepositHelperVotium.connect(signers.dao).removeApprovedGauge(gauge1)).to.be.revertedWith("!weight");
            });
            it("should allow gauge to be removed if weight is 0", async () => {
                await DepositHelperVotium.connect(signers.manager).setWeights([gauge1],[10000]);
                expect(await DepositHelperVotium.currentWeightOfGauge(gauge1)).to.be.equal(10000);
                expect(await DepositHelperVotium.currentWeightOfGauge(gauge2)).to.be.equal(0);
                await DepositHelperVotium.connect(signers.dao).removeApprovedGauge(gauge2);
                expect(await DepositHelperVotium.isApprovedGauge(gauge2)).to.be.equal(false);
            });
            it("should re-add gauge2 (and set weights as dao)", async () => {
                await DepositHelperVotium.connect(signers.dao).addApprovedGauge(gauge2);
                expect(await DepositHelperVotium.isApprovedGauge(gauge2)).to.be.equal(true);
                await DepositHelperVotium.connect(signers.dao).setWeights([gauge1, gauge2],[6000, 4000]);
                expect(await DepositHelperVotium.currentWeightOfGauge(gauge1)).to.be.equal(6000);
                expect(await DepositHelperVotium.currentWeightOfGauge(gauge2)).to.be.equal(4000);
            });
            it("should not allow a weight to be set to 0 except by omission", async () => {
                await expect(DepositHelperVotium.connect(signers.manager).setWeights([gauge1, gauge2],[10000, 0])).to.be.revertedWith("!zero");
            });
            it("should not allow public to change exclusion list", async () => {
                await expect(DepositHelperVotium.connect(signers.minter).setExcludeAddresses([manager])).to.be.revertedWith("!auth");
            });
            it("should now allow exclusions to have duplicate", async() => {
                await expect(DepositHelperVotium.connect(signers.dao).setExcludeAddresses([tommyAddress, vestingAddress, daoAddress, daoAddress])).to.be.revertedWith("!sorted");
            });
            it("should allow manager or dao to change exclusion list", async () => {
                await expect(DepositHelperVotium.connect(signers.manager).setExcludeAddresses([manager])).to.not.be.reverted;
                await expect(DepositHelperVotium.connect(signers.dao).setExcludeAddresses([vestingAddress, daoAddress, tommyAddress, votiAddress])).to.not.be.reverted;
            });
            it("should add gauges3 and 4 to helperTwo", async () => {
                await DepositHelperTwo.connect(signers.dao).addApprovedGauge(gauge3);
                expect(await DepositHelperTwo.isApprovedGauge(gauge3)).to.be.equal(true);
                await DepositHelperTwo.connect(signers.dao).addApprovedGauge(gauge4);
                expect(await DepositHelperTwo.isApprovedGauge(gauge4)).to.be.equal(true);
                await DepositHelperTwo.connect(signers.manager).setWeights([gauge3, gauge4],[5000, 5000]);
                expect(await DepositHelperTwo.currentWeightOfGauge(gauge3)).to.be.equal(5000);
                expect(await DepositHelperTwo.currentWeightOfGauge(gauge4)).to.be.equal(5000);
            });
        });
    });
    describe("Claim test", function () {
        it("should fail if YB is not yet approved on Votium", async () => {
            var allowed = await votium.tokenAllowed(ybAddress);
            if(!allowed) {
                await expect(DepositPlatformDivider.claim()).to.be.revertedWith("!allowlist");
                await votium.connect(signers.tommy).allowToken(ybAddress, true);
                allowed = await votium.tokenAllowed(ybAddress);
                expect(allowed).to.be.equal(true);
            }
        });
        it("should claim and distribute rewards correctly", async () => {
            // check initial balances of votium
            var votiumBalance1 = await yb.balanceOf(votiumAddress);
            expect(votiumBalance1).to.be.equal(0);
            await DepositPlatformDivider.claim();
            // check votium balance again
            var votiumBalance2 = await yb.balanceOf(votiumAddress);
            var diff = votiumBalance2 - votiumBalance1;
            expect(votiumBalance2).to.be.gt(votiumBalance1);
            var gauge1Info = await votium.viewIncentive(await votium.activeRound(), gauge1, 0);
            var gauge2Info = await votium.viewIncentive(await votium.activeRound(), gauge2, 0);
            var gauge3Info = await votium.viewIncentive(await votium.activeRound(), gauge3, 0);
            var gauge4Info = await votium.viewIncentive(await votium.activeRound(), gauge4, 0);
            // gauge 1 and 2 together should have 70% of difference
            expect(gauge1Info.amount + gauge2Info.amount).to.be.closeTo((diff * 7000n)/10000n, 1);
            // gauge 3 and 4 together should have 30% of difference
            expect(gauge3Info.amount + gauge4Info.amount).to.be.closeTo((diff * 3000n)/10000n, 1);
            // gauge 1 should have 60% of difference * 70%
            expect(gauge1Info.amount).to.be.closeTo((diff * 7000n)/10000n * 6000n/10000n, 1);
            // gauge 2 should have 40% of difference * 70%
            expect(gauge2Info.amount).to.be.closeTo((diff * 7000n)/10000n * 4000n/10000n, 1);
            // gauge 3 should have 50% of difference * 30%
            expect(gauge3Info.amount).to.be.closeTo((diff * 3000n)/10000n * 5000n/10000n, 1);
            // gauge 4 should have 50% of difference * 30%
            expect(gauge4Info.amount).to.be.closeTo((diff * 3000n)/10000n * 5000n/10000n, 1);
        });
        it("should have used 3 of 4 exclusions as Votium capped at 3", async () => {
            var gauge1Info = await votium.viewIncentive(await votium.activeRound(), gauge1, 0);
            expect(gauge1Info.excluded.length).to.be.equal(3);
            expect(gauge1Info.excluded[0]).to.be.equal(vestingAddress);
            expect(gauge1Info.excluded[1]).to.be.equal(daoAddress);
            expect(gauge1Info.excluded[2]).to.be.equal(tommyAddress);
        });
    });
    describe("Gas test", function() {
        it("should add a bunch of helpers to divider", async () => {
            await expect(DepositPlatformDivider.connect(signers.dao).addDepositHelper(dead[0])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).addDepositHelper(dead[1])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).addDepositHelper(dead[2])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).addDepositHelper(dead[3])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).addDepositHelper(dead[4])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).addDepositHelper(dead[5])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).addDepositHelper(dead[6])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).addDepositHelper(dead[7])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).addDepositHelper(dead[8])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).addDepositHelper(dead[9])).to.not.be.reverted;
        });
        it("should set various weights for all helpers", async() => {
            await expect(DepositPlatformDivider.connect(signers.dao).setWeights([dead[0], dead[1], dead[2], dead[3], dead[4], dead[5], dead[6], dead[7], dead[8], dead[9], helperVotiumAddress, helperTwoAddress],[800, 800, 800, 800, 800, 800, 800, 800, 800, 800, 800, 1200])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).setWeights([dead[0], dead[1], dead[2], dead[3], dead[4], dead[5], dead[6], dead[7], dead[8], dead[9], helperVotiumAddress, helperTwoAddress],[800, 800, 800, 800, 800, 800, 800, 800, 800, 800, 800, 1200])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).setWeights([dead[0], dead[1], dead[2], dead[3], dead[4], dead[5], dead[6], dead[7], dead[8], dead[9], helperVotiumAddress, helperTwoAddress],[800, 800, 800, 800, 800, 800, 800, 800, 800, 800, 800, 1200])).to.not.be.reverted;
            await expect(DepositPlatformDivider.connect(signers.dao).setWeights([dead[0], dead[1], dead[2], dead[3], dead[4], dead[5], dead[6], dead[7], dead[8], dead[9], helperVotiumAddress, helperTwoAddress],[800, 800, 800, 800, 800, 800, 800, 800, 800, 800, 800, 1200])).to.not.be.reverted;
        });
    });
});