// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";
// import {FunctionsClient} from "@chainlink/contracts/src/v0.8/dev/v0.8/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
// import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/dev/v0.8/libraries/FunctionsRequest.sol";


//import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";

/**
 * Request testnet LINK and ETH here: https://faucets.chain.link/
 * Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/resources/link-token-contracts/
 */

/**
 * @title VotingContract
 * @notice A contract for voting using Chainlink functions
 */
contract VotingContract is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // State variables to store the vote counts for each candidate
    mapping(string => uint256) public votes;

    // Event to log vote submissions
    event VoteSubmitted(address indexed voter, string candidate);

    // Router address - Hardcoded for Mumbai
    address router = 0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C;

    // JavaScript source code to fetch vote counts from an external API
    string constant source =
        "const apiResponse = await fetch('https://example.com/vote-counts');"
        "if (!apiResponse.ok) {"
        "  throw Error('Request failed');"
        "}"
        "const data = await apiResponse.json();"
        "return data;";

    // Callback gas limit
    uint32 gasLimit = 300000;

    // donID - Hardcoded for Mumbai
    bytes32 donID =
        0x66756e2d706f6c79676f6e2d6d756d6261692d31000000000000000000000000;

    /**
     * @notice Initializes the contract with the Chainlink router address and sets the contract owner
     */
    constructor() FunctionsClient(router) ConfirmedOwner(msg.sender) {}

    /**
     * @notice Allows users to vote for a candidate
     * @param candidate The name of the candidate to vote for
     */
    function vote(string calldata candidate) external {
        // Increment the vote count for the selected candidate
        votes[candidate]++;

        // Emit an event to log the vote submission
        emit VoteSubmitted(msg.sender, candidate);
    }

    /**
     * @notice Fetches the latest vote counts from the external API using Chainlink functions
     */
    function fetchVoteCounts() external onlyOwner {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source); // Initialize the request with JS code

        // Send the request to fetch vote counts and store the request ID
        _sendRequest(req.encodeCBOR(), 0, gasLimit, donID); // Setting subscriptionId to 0 as we're not using subscriptions
    }

    /**
     * @notice Callback function for fulfilling a request
     * @param requestId The ID of the request to fulfill
     * @param response The HTTP response data
     * @param err Any errors from the Functions request
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory  err 
    ) internal override {
        // Update the vote counts based on the response from the external API
        (uint256[] memory counts) = abi.decode(response, (uint256[]));

        for (uint256 i = 0; i < counts.length; i++) {
            // Assuming candidates are indexed from 0
            votes[string(abi.encodePacked("Candidate", uint8(i)))] = counts[i];
        }
    }
}
