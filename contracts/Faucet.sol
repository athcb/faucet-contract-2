// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Faucet is ReentrancyGuard {
  address payable public owner;

  constructor() payable {
    owner = payable(msg.sender);
  }
  
  function withdraw(uint _amount) payable public nonReentrant {
    // users can only withdraw .1 ETH at a time, feel free to change this!
    require(_amount <= 100000000000000000, "Amount larger than 0.1 ETH");
  
    (bool sent, ) = payable(msg.sender).call{value: _amount}("");
    require(sent, "Failed to send Ether");
  }

  function withdrawAll() onlyOwner public nonReentrant {
    (bool sent, ) = owner.call{value: address(this).balance}("");
    require(sent, "Failed to send Ether");
  }

  function destroyFaucet() onlyOwner public {
    selfdestruct(payable(owner));
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Not the owner");
    _;
  }
}