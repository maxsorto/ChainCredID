// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IEAS, AttestationRequest, AttestationRequestData } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { NO_EXPIRATION_TIME, EMPTY_UID } from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";

contract CitizenDatabase {

    struct Citizen {
        bool canVote;
        bool canDrink;
        bool canEnterCountry;
       
    }

    mapping(address => Citizen) public citizens;

    // Address of the Ethereum Attestation Service contract
    address easAddress = 0xaEF4103A04090071165F78D45D83A0C0782c2B2a;
    
    // Schema for attestation
    bytes32 schema = 0x6f0ae5ac9195bd29d2e9942d12d313d157da57ce56be88ab2c97bf94d39f6f5e;

    event Attestation(address indexed citizen);

    // Function to add a new citizen to the database
    function addCitizen(
        address _userAddress,
        bool _canVote,
        bool _canDrink,
        bool _canEnterCountry
        
    ) public {
        citizens[_userAddress] = Citizen(_canVote, _canDrink, _canEnterCountry);
    }

    // Function to attest right to vote
    function attestRightToVote(address _userAddress, bool _canVote) public {
        require(!citizens[_userAddress].canVote); // Ensure citizenship is not already attested
        citizens[_userAddress].canVote = _canVote; // Attest right to vote

        // Attest citizenship using Ethereum Attestation Service
        IEAS(easAddress).attest(
            AttestationRequest({
                schema: schema,
                data: AttestationRequestData({
                    recipient: _userAddress,
                    expirationTime: NO_EXPIRATION_TIME,
                    revocable: false,
                    refUID: EMPTY_UID,
                    data: abi.encode(_userAddress), // Include citizen's address in the attestation data
                    value: 0 // No value/ETH
                })
            })
        );

        emit Attestation(_userAddress);
    }

    // Function to attest right to drink
    function attestRightToDrink(address _userAddress, bool _canDrink) public {
        require(!citizens[_userAddress].canDrink); // Ensure right to drink is not already attested
        citizens[_userAddress].canDrink = _canDrink; // Attest right to drink

        // Attest citizenship using Ethereum Attestation Service
        IEAS(easAddress).attest(
            AttestationRequest({
                schema: schema,
                data: AttestationRequestData({
                    recipient: _userAddress,
                    expirationTime: NO_EXPIRATION_TIME,
                    revocable: false,
                    refUID: EMPTY_UID,
                    data: abi.encode(_userAddress), // Include citizen's address in the attestation data
                    value: 0 // No value/ETH
                })
            })
        );

        emit Attestation(_userAddress);
    }

    // Function to attest right to enter country
    function attestRightToEnterCountry(address _userAddress, bool _canEnterCountry) public  {
        require(!citizens[_userAddress].canEnterCountry); // Ensure right to enter country is not already attested
        citizens[_userAddress].canEnterCountry = _canEnterCountry; // Attest right to enter country

        // Attest citizenship using Ethereum Attestation Service
        IEAS(easAddress).attest(
            AttestationRequest({
                schema: schema,
                data: AttestationRequestData({
                    recipient: _userAddress,
                    expirationTime: NO_EXPIRATION_TIME,
                    revocable: false,
                    refUID: EMPTY_UID,
                    data: abi.encode(_userAddress), // Include citizen's address in the attestation data
                    value: 0 // No value/ETH
                })
            })
        );

        emit Attestation(_userAddress);
    }

    // Function to verify right to vote
    function verifyRightToVote(address _citizen) public view returns (bool) {
        return citizens[_citizen].canVote;
    }

    // Function to verify right to drink
    function verifyRightToDrink(address _citizen) public view returns (bool) {
        return citizens[_citizen].canDrink;
    }

    // Function to verify right to enter country
    function verifyRightToEnterCountry(address _citizen) public view returns (bool) {
        return citizens[_citizen].canEnterCountry;
    }
}
