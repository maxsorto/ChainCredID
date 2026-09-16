// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import {
    IEAS,
    AttestationRequest,
    AttestationRequestData,
    RevocationRequest,
    RevocationRequestData
} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {
    Attestation,
    EMPTY_UID,
    NO_EXPIRATION_TIME
} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";

/// @title ChainCredID
/// @notice Issuer-gated registry of typed, revocable, expiring credentials. Every credential is an
///         Ethereum Attestation Service (EAS) attestation issued by this contract under a single
///         schema, so any EAS-aware verifier can check it without trusting this contract's storage.
/// @dev    Schema: `bytes32 credentialType,string metadataURI`.
///         `hasCredential` reads the attestation back from EAS (not a local mirror) and treats a
///         credential as active only if it exists, is not revoked and has not expired.
contract ChainCredID is AccessControl {
    // ------------------------------------------------------------------ constants

    /// @notice Accounts allowed to issue and revoke credentials.
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    // ------------------------------------------------------------------ immutables

    /// @notice The EAS deployment this registry attests through.
    IEAS public immutable eas;

    /// @notice UID of the EAS schema every credential is attested under.
    bytes32 public immutable schemaUID;

    // ------------------------------------------------------------------ storage

    /// @dev subject => credentialType => UID of the most recent attestation (may be revoked/expired).
    mapping(address subject => mapping(bytes32 credentialType => bytes32 uid)) private _uids;

    // ------------------------------------------------------------------ events

    event CredentialIssued(
        address indexed subject,
        bytes32 indexed credentialType,
        bytes32 indexed uid,
        address issuer,
        uint64 expirationTime,
        string metadataURI
    );

    event CredentialRevoked(
        address indexed subject,
        bytes32 indexed credentialType,
        bytes32 indexed uid,
        address revoker
    );

    // ------------------------------------------------------------------ errors

    error ZeroAddress();
    error ZeroSchema();
    error ExpirationInPast(uint64 expirationTime, uint256 nowTimestamp);
    error CredentialAlreadyActive(address subject, bytes32 credentialType, bytes32 uid);
    error NoActiveCredential(address subject, bytes32 credentialType);

    // ------------------------------------------------------------------ constructor

    /// @param eas_ EAS contract (OP Stack predeploy `0x4200...0021` on Base / Optimism).
    /// @param schemaUID_ Schema registered as `bytes32 credentialType,string metadataURI`, revocable.
    /// @param admin Receives `DEFAULT_ADMIN_ROLE`; grants `ISSUER_ROLE` to issuers.
    constructor(IEAS eas_, bytes32 schemaUID_, address admin) {
        if (address(eas_) == address(0) || admin == address(0)) revert ZeroAddress();
        if (schemaUID_ == EMPTY_UID) revert ZeroSchema();
        eas = eas_;
        schemaUID = schemaUID_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ------------------------------------------------------------------ issuer actions

    /// @notice Issue a credential of `credentialType` to `subject` as a revocable EAS attestation.
    /// @param subject Wallet (human operator, smart account or agent wallet) receiving the credential.
    /// @param credentialType Namespaced type, see {credentialTypeId}.
    /// @param expirationTime Unix timestamp after which the credential is inactive; 0 = never.
    /// @param metadataURI Optional pointer to off-chain evidence (IPFS, https, data URI). May be empty.
    /// @return uid EAS attestation UID.
    function issue(
        address subject,
        bytes32 credentialType,
        uint64 expirationTime,
        string calldata metadataURI
    ) external onlyRole(ISSUER_ROLE) returns (bytes32 uid) {
        if (subject == address(0)) revert ZeroAddress();
        if (expirationTime != NO_EXPIRATION_TIME && expirationTime <= block.timestamp) {
            revert ExpirationInPast(expirationTime, block.timestamp);
        }

        bytes32 existing = _uids[subject][credentialType];
        if (existing != EMPTY_UID && _isActive(existing)) {
            revert CredentialAlreadyActive(subject, credentialType, existing);
        }

        uid = eas.attest(
            AttestationRequest({
                schema: schemaUID,
                data: AttestationRequestData({
                    recipient: subject,
                    expirationTime: expirationTime,
                    revocable: true,
                    refUID: existing, // link re-issues to their predecessor for auditability
                    data: abi.encode(credentialType, metadataURI),
                    value: 0
                })
            })
        );

        _uids[subject][credentialType] = uid;
        emit CredentialIssued(subject, credentialType, uid, msg.sender, expirationTime, metadataURI);
    }

    /// @notice Revoke the active credential of `credentialType` held by `subject`.
    function revoke(address subject, bytes32 credentialType) external onlyRole(ISSUER_ROLE) {
        bytes32 uid = _uids[subject][credentialType];
        if (uid == EMPTY_UID || !_isActive(uid)) {
            revert NoActiveCredential(subject, credentialType);
        }

        eas.revoke(
            RevocationRequest({
                schema: schemaUID, data: RevocationRequestData({ uid: uid, value: 0 })
            })
        );

        emit CredentialRevoked(subject, credentialType, uid, msg.sender);
    }

    // ------------------------------------------------------------------ views

    /// @notice True if `subject` currently holds an unrevoked, unexpired credential of `credentialType`.
    function hasCredential(address subject, bytes32 credentialType) external view returns (bool) {
        bytes32 uid = _uids[subject][credentialType];
        return uid != EMPTY_UID && _isActive(uid);
    }

    /// @notice Most recent attestation UID for (`subject`, `credentialType`), active or not.
    function credentialUID(address subject, bytes32 credentialType)
        external
        view
        returns (bytes32)
    {
        return _uids[subject][credentialType];
    }

    /// @notice Full EAS attestation for the most recent credential, plus decoded fields.
    /// @dev Returns an empty attestation (uid == 0) if none was ever issued.
    function getCredential(address subject, bytes32 credentialType)
        external
        view
        returns (Attestation memory attestation, string memory metadataURI, bool active)
    {
        bytes32 uid = _uids[subject][credentialType];
        if (uid == EMPTY_UID) return (attestation, "", false);
        attestation = eas.getAttestation(uid);
        (, metadataURI) = abi.decode(attestation.data, (bytes32, string));
        active = _isLive(attestation);
    }

    /// @notice Canonical way to derive a credential type id from a human-readable name.
    /// @dev e.g. `credentialTypeId("OPERATOR_KYC")`. Kept on-chain so frontends and agents agree.
    function credentialTypeId(string memory name) external pure returns (bytes32) {
        return keccak256(bytes(name));
    }

    // ------------------------------------------------------------------ internal

    function _isActive(bytes32 uid) internal view returns (bool) {
        return _isLive(eas.getAttestation(uid));
    }

    function _isLive(Attestation memory a) internal view returns (bool) {
        return a.uid != EMPTY_UID && a.revocationTime == 0
            && (a.expirationTime == NO_EXPIRATION_TIME || a.expirationTime > block.timestamp);
    }
}
