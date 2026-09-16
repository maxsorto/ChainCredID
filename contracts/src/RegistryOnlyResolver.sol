// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IEAS } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";
import {
    SchemaResolver
} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";

/// @title RegistryOnlyResolver
/// @notice EAS schema resolver that only accepts attestations (and revocations) whose attester is
///         the ChainCredID registry. This closes the schema: a verifier that sees an attestation
///         under this schema UID knows it went through the issuer-gated registry, so it does not
///         need to check the attester address itself.
/// @dev    The registry address is bound once after deployment because the registry needs the
///         schema UID (which needs this resolver) in its constructor.
contract RegistryOnlyResolver is SchemaResolver, Ownable {
    address public registry;

    event RegistryBound(address indexed registry);

    error RegistryAlreadyBound(address registry);
    error ZeroAddress();

    constructor(IEAS eas, address owner_) SchemaResolver(eas) Ownable(owner_) { }

    /// @notice Bind the registry allowed to attest under this schema. Callable once.
    function bindRegistry(address registry_) external onlyOwner {
        if (registry_ == address(0)) revert ZeroAddress();
        if (registry != address(0)) revert RegistryAlreadyBound(registry);
        registry = registry_;
        emit RegistryBound(registry_);
    }

    function onAttest(Attestation calldata attestation, uint256)
        internal
        view
        override
        returns (bool)
    {
        return registry != address(0) && attestation.attester == registry;
    }

    function onRevoke(Attestation calldata attestation, uint256)
        internal
        view
        override
        returns (bool)
    {
        return attestation.attester == registry;
    }
}
