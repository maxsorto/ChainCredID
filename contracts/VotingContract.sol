// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract ChainlinkVoting3 is  AutomationCompatibleInterface {
    mapping(string => uint256) public votes;
    event VoteSubmitted(address indexed voter, string candidate);

    bool public votingLive = false;
    uint public voteEndTime;

    // No parameters are needed for the Ownable constructor
  

    function vote(string calldata candidate) external {
        require(votingLive, "Voting is not currently active.");
        votes[candidate]++;
        emit VoteSubmitted(msg.sender, candidate);
    }

    function startVote(uint voteMinutes) public  {
        require(!votingLive, "Voting already active.");
        votingLive = true;
        voteEndTime = block.timestamp + voteMinutes * 1 minutes;
    }

    // Chainlink Automation functions
    function checkUpkeep(bytes calldata) external override view returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = votingLive && (block.timestamp > voteEndTime);
        return (upkeepNeeded, "");
    }

    function performUpkeep(bytes calldata) external override {
        require(votingLive && (block.timestamp > voteEndTime), "Voting period is not over yet or voting not started.");
        votingLive = false;
    }
}
