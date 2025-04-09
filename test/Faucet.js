const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Faucet', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = await Faucet.deploy( {value: ethers.parseEther("1")} );

    console.log('Faucet address: ', faucet.target);
    const [owner, nonOwner] = await ethers.getSigners();
    
    const allowedAmount = ethers.parseEther('0.1');
    console.log("Allowed amount: ", allowedAmount);
    const overAllowedAmount = ethers.parseEther('1');
  
    console.log('Signer 1 address: ', owner.address);
    return { faucet, owner, nonOwner, allowedAmount, overAllowedAmount };
  }

  async function deployAndDestroy() {
    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = await Faucet.deploy( {value: ethers.parseEther("1")} );
    const [owner] = await ethers.getSigners();
    
    console.log("Faucet target: ", faucet.target);
    console.log("Owner address: ", owner.address);

    //const codeBefore = await ethers.provider.getCode(faucet.target);
    //console.log('Code before selfdestruct: ', codeBefore);

    const tx = await faucet.connect(owner).destroyFaucet();
    const receipt = await tx.wait();

    console.log("Transaction receipt logs: ", receipt.logs);	
    console.log("Transaction hash: ", tx.hash);

    return { faucet }
  }

  it('should deploy and set the owner correctly', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    expect(await faucet.owner()).to.equal(owner.address);
  });

  it('should have a balance of 1 ETH', async function() {
    const { faucet } = await loadFixture(deployContractAndSetVariables);
    const balance = await ethers.provider.getBalance(faucet.target);
    console.log("Faucet balance: ", ethers.formatEther(balance));

    expect(balance).to.equal(ethers.parseEther('1'));
  })

  it('withdrawal of 0.2 ETH should be reverted', async function(){
    const { faucet, overAllowedAmount } = await loadFixture(deployContractAndSetVariables);

    await expect(faucet.withdraw(overAllowedAmount)).to.be.reverted;
  });

  it('withdrawal of 0.1 ETH should not be reverted', async function(){
    const { faucet, allowedAmount } = await loadFixture(deployContractAndSetVariables);

    await expect(faucet.withdraw(allowedAmount)).to.not.be.reverted;

  });

  it('non-owners cannot call withdrawAll function', async function() {

    const { faucet, owner, nonOwner} = await loadFixture(deployContractAndSetVariables);
    
    console.log('Non-owner address: ', nonOwner.address);
    console.log('Owner address: ', owner.address);

    await expect(faucet.connect(nonOwner).withdrawAll()).to.be.reverted;

  });

  it('owner can call withdrawAll function', async function() {

    const { faucet } = await loadFixture(deployContractAndSetVariables);

    await expect(faucet.withdrawAll()).to.not.be.reverted;

  });

  it('non-owners cannot call destroyFaucet function', async function() {
    const { faucet, owner, nonOwner } = await loadFixture(deployContractAndSetVariables);
   
    console.log('Non-owner address: ', nonOwner.address);
    console.log('Owner address: ', owner.address);

    await expect(faucet.connect(nonOwner).destroyFaucet()).to.be.reverted;

  });

  it('owner can call destroyFaucet function', async function() {
    const { faucet } = await loadFixture(deployContractAndSetVariables);

    await expect(faucet.destroyFaucet()).to.not.be.reverted;

  });

  it('calling destroyFaucet causes the contract to selfdestruct', async function() {
    
    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = await Faucet.deploy( {value: ethers.parseEther("1")} );
    const [owner] = await ethers.getSigners();
    
    console.log("Faucet target: ", faucet.target);
    console.log("Owner address: ", owner.address);

    ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
    console.log("Owner balance before: ", ethers.formatEther(ownerBalanceBefore));
    

    //const codeBefore = await ethers.provider.getCode(faucet.target);
    //console.log('Code before selfdestruct: ', codeBefore);

    const tx = await faucet.connect(owner).destroyFaucet();
    const receipt = await tx.wait();

    console.log("Transaction hash: ", tx.hash);
    console.log("Transaction receipt logs: ", receipt.logs);	
    console.log("Transaction receipt to: ", receipt.to);
    console.log("Receipt", receipt);
    

    await ethers.provider.send("evm_mine"); // forces a block
    console.log("EVM mined");
    await new Promise((res) => setTimeout(res, 1000)); 

    /*
    try {
      await faucet.withdraw(ethers.parseEther('0.1')); // or any valid function
      throw new Error("Expected error, but call succeeded");
    } catch (err) {
      console.log("Error: ", err);
      expect(err.message).to.include("call revert"); // or "execution reverted"
    }
      */

    ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    console.log("Owner balance after: ", ethers.formatEther(ownerBalanceAfter));
    console.log(typeof ownerBalanceBefore)
    console.log("Owner balance difference: ", Math.round(ethers.formatEther(ownerBalanceAfter - ownerBalanceBefore)));
    
  
    // Check that the contract has been destroyed
    const code = await ethers.provider.getCode(faucet.target);
    console.log("Code after selfdestruct: ", code);

    expect(code).to.equal('0x');

  });

  it('withdrawAll returns all contract funds to owner', async function() {

    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
    const faucetBalanceBefore = await ethers.provider.getBalance(faucet.target);
    console.log("Faucet balance before: ", ethers.formatEther(faucetBalanceBefore));

    await faucet.connect(owner).withdrawAll();

    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    const faucetBalanceAfter = await ethers.provider.getBalance(faucet.target);
    console.log("Faucet balance after: ", ethers.formatEther(faucetBalanceAfter));

    const ownerBalanceDiff = Math.round(ethers.formatEther(ownerBalanceAfter - ownerBalanceBefore));
    console.log("Owner balance difference: ", ownerBalanceDiff);

    expect(ownerBalanceDiff).to.equal(1);

  });

});