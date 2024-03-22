// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract VotingContract is VRFConsumerBase {
    uint256 public proposalCount;
    mapping(uint256 => uint256) public votes; // proposal ID => vote count

    address public owner;
    bytes32 public requestId;
    uint256 public randomResult;

    event ProposalCreated(uint256 proposalId, string description);
    event Voted(uint256 proposalId, address voter);

    constructor(address _vrfCoordinator, address _linkToken, bytes32 _keyHash, uint256 _fee)
        VRFConsumerBase(_vrfCoordinator, _linkToken)
    {
        owner = msg.sender;
        proposalCount = 0;
        setKeyHash(_keyHash);
        setFee(_fee);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }

    function createProposal(string memory _description) external onlyOwner {
        proposalCount++;
        emit ProposalCreated(proposalCount, _description);
    }

    function vote(uint256 _proposalId) external {
        require(_proposalId <= proposalCount && _proposalId > 0, "Invalid proposal ID");
        votes[_proposalId]++;
        emit Voted(_proposalId, msg.sender);
    }

    function getRandomNumber() external onlyOwner returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK tokens");
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 _requestId, uint256 _randomness) internal override {
        requestId = _requestId;
        randomResult = _randomness;
    }

    function getWinner() external view onlyOwner returns (uint256) {
        require(randomResult > 0, "Random number not generated yet");
        return randomResult % proposalCount + 1;
    }

    function withdrawLink() external onlyOwner {
        require(LINK.transfer(owner, LINK.balanceOf(address(this))), "Failed to transfer LINK to owner");
    }

    function setKeyHash(bytes32 _keyHash) public onlyOwner {
        keyHash = _keyHash;
    }

    function setFee(uint256 _fee) public onlyOwner {
        fee = _fee;
    }
}
