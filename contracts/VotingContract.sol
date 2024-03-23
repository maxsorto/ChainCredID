// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title VotingContract
 * @notice A contract for voting using Chainlink functions, adapted to query vote counts from a custom API.
 */
contract VotingContract is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // State variables to store the last request ID, response, and error
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    // State variables to store the vote counts for each candidate
    mapping(string => uint256) public votes;

    mapping(bytes32 => string) private requestIdToCandidate;



    // Router address and DON ID should be set according to your Chainlink Functions setup
    address private router;
    bytes32 private donID;

    // Custom error type
    error UnexpectedRequestID(bytes32 requestId);

    // Event to log responses
    event Response(
        bytes32 indexed requestId,
        string candidate,
        bytes response,
        bytes err
    );


    // JavaScript source code adapted for the provided API
    string source =
        "const apiResponse = await Functions.makeHttpRequest({"
        "url: `https://chaincredid.pages.dev/vote-counts`"
        "});"
        "if (apiResponse.error) {"
        "throw Error('Request failed');"
        "}"
        "const { data } = apiResponse;"
        "return Functions.encodeString(JSON.stringify(data));"; // Assuming the API returns JSON

    // Callback gas limit - adjust based on expected computation
    uint32 private gasLimit = 300000;



    // Event to log vote submissions
    event VoteSubmitted(address indexed voter, string candidate);
    event VoteCountUpdated(string candidate, uint256 newVoteCount);
    event RequestSent(bytes32 requestId, string candidate);
    event RequestFulfilled(bytes32 requestId, uint256 finalVoteCount);

    /**
     * @notice Initializes the contract with the Chainlink router address
     */
    constructor(address _router, bytes32 _donID) FunctionsClient(_router) ConfirmedOwner(msg.sender) {
        router = _router;
        donID = _donID;
    }

    /**
     * @notice Allows users to vote for a candidate
     * @param candidate The name of the candidate to vote for
     */
    function vote(string calldata candidate) external {
        votes[candidate]++;
        emit VoteSubmitted(msg.sender, candidate);
    }

        /**
     * @notice Sends a request to calculate final votes for a candidate using Chainlink Functions
     * @param candidateName The name of the candidate
     * @return requestId The ID of the request
     */
    function calculateFinalVotes(string calldata candidateName) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req = FunctionsRequest.Request({
            url: "https://chaincredid.pages.dev/vote-multipliers", // Your API endpoint
            path: candidateName, // Assuming the API can filter based on the candidate name in the path or query
            method: FunctionsRequest.HttpMethod.GET,
            requestBody: "", // Empty if not needed
            headers: new string 
        });

        // Send the request with the Chainlink Functions client
        s_lastRequestId = req.sendRequest(router, gasLimit, donID);
        requestIdToCandidate[s_lastRequestId] = candidateName;

        return s_lastRequestId;
    }

    /**
     * @notice Sends a request to fetch vote counts from the external API with optional arguments
     * @param subscriptionId The ID for the Chainlink subscription
     * @param args The arguments to pass to the JavaScript function, if needed
     * @return requestId The ID of the request
     */
    function sendRequest(
        uint64 subscriptionId,
        string[] calldata args
    ) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source); // Initialize the request with JS code
        if (args.length > 0) {
            req.setArgs(args); // Set the arguments for the request, if any
        }

        // Send the request and store the request ID
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );

        return s_lastRequestId;
    }

    /**
     * @notice Callback function for fulfilling a request
     * @param requestId The ID of the request to fulfill
     * @param response The data returned by the external API
     * @param err Any errors returned during the request
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            
            revert UnexpectedRequestID(requestId); // Check if request IDs match
        }

        // Update the contract's state variables with the response and any errors
        s_lastResponse = response;
        s_lastError = err;

        // Assuming the API response is directly decodable to a string
        // The real logic for processing and updating votes based on the response goes here
        // This example directly logs the received string for simplicity
        string memory candidate = string(response);

        // Update the contract's state with the new vote count
        string memory candidateName = requestIdToCandidate[requestId];

        // votes[candidateName] = finalVoteCount;

        // Emit an event with the new vote count
        emit VoteCountUpdated(candidateName /*finalVoteCount*/); 

        // Emit an event to log the response
        emit Response(requestId, candidate, s_lastResponse, s_lastError);
    }
}
