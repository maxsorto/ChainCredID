// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IEAS, AttestationRequest, AttestationRequestData } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { NO_EXPIRATION_TIME, EMPTY_UID } from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";
import { FunctionsClient } from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import { ConfirmedOwner } from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import { FunctionsRequest } from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";

contract CitizenDatabase is FunctionsClient, ConfirmedOwner {
    struct Citizen {
        bool canVote;
        bool canDrink;
        bool canEnterCountry;
    }

    mapping(address => Citizen) public citizens;

    // Address of the Ethereum Attestation Service contract
    address easAddress;

    // Schema for attestation
    bytes32 schema;

    event Attestation(address indexed citizen);
    event Response(bytes32 indexed requestId, string character, bytes response, bytes err);
    
    constructor(address _router, address _easAddress, bytes32 _schema, bytes32 _donId) FunctionsClient(_router) ConfirmedOwner(msg.sender) {
        easAddress = _easAddress;
        schema = _schema;
        donId = _donId;
    }

    function attestRights(
        address _userAddress,
        bool _canVote,
        bool _canDrink,
        bool _canEnterCountry
    ) external onlyOwner {
        citizens[_userAddress] = Citizen(_canVote, _canDrink, _canEnterCountry);

        // Attest rights using Chainlink Functions
        sendRequest(_userAddress, _canVote, _canDrink, _canEnterCountry);
        
        emit Attestation(_userAddress);
    }

    function attestRightToVote(address _userAddress, bool _canVote) external onlyOwner {
        citizens[_userAddress].canVote = _canVote;

        // Attest right to vote using Chainlink Functions
        sendRequest(_userAddress, _canVote, false, false);

        emit Attestation(_userAddress);
    }

    function attestRightToDrink(address _userAddress, bool _canDrink) external onlyOwner {
        citizens[_userAddress].canDrink = _canDrink;

        // Attest right to drink using Chainlink Functions
        sendRequest(_userAddress, false, _canDrink, false);

        emit Attestation(_userAddress);
    }

    function attestRightToEnterCountry(address _userAddress, bool _canEnterCountry) external onlyOwner {
        citizens[_userAddress].canEnterCountry = _canEnterCountry;

        // Attest right to enter country using Chainlink Functions
        sendRequest(_userAddress, false, false, _canEnterCountry);

        emit Attestation(_userAddress);
    }

    function sendRequest(
        address _userAddress,
        bool _canVote,
        bool _canDrink,
        bool _canEnterCountry
    ) private {
        string memory source = string(
            abi.encodePacked(
                "function sendRequest(address, bool, bool, bool) internal {",
                "emit Attestation(_userAddress);"
            )
        );

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        req.setArgs(new string ); // No arguments needed

        bytes32 subscriptionId = 0x123; // Placeholder subscription ID
        uint32 callbackGasLimit = 300000; // Gas limit for the callback

        bytes memory data = abi.encode(_userAddress, _canVote, _canDrink, _canEnterCountry);

        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            callbackGasLimit,
            donId,
            data
        );
    }

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (requestId != s_lastRequestId) {
            revert UnexpectedRequestID(requestId); // Check if request IDs match
        }
        // Update the contract's state variables with the response and any errors
        s_lastResponse = response;
        s_lastError = err;

        // Emit an event to log the response
        emit Response(requestId, string(response), s_lastResponse, s_lastError);
    }
}
