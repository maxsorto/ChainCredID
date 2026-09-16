// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console } from "forge-std/Script.sol";
import { IEAS } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {
    ISchemaRegistry
} from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";
import { EAS } from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";
import {
    SchemaRegistry
} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";

import { ChainCredID } from "../src/ChainCredID.sol";
import { RegistryOnlyResolver } from "../src/RegistryOnlyResolver.sol";

/// @notice Deploys the resolver, registers the schema, deploys the registry and binds them.
///
/// Env:
///   EAS_ADDRESS, SCHEMA_REGISTRY_ADDRESS  existing EAS deployment (Base Sepolia: 0x4200...0021 / 0020).
///                                         If EAS_ADDRESS is unset, a fresh EAS is deployed (local anvil).
///   ADMIN                                 receives DEFAULT_ADMIN_ROLE and ISSUER_ROLE (defaults to broadcaster).
///
/// Testnet only. Never point this at a mainnet RPC without a review.
contract Deploy is Script {
    string public constant SCHEMA = "bytes32 credentialType,string metadataURI";

    function run() external {
        address broadcaster = msg.sender;
        address admin = vm.envOr("ADMIN", broadcaster);

        vm.startBroadcast();

        (IEAS eas, ISchemaRegistry schemaRegistry) = _resolveEAS();

        RegistryOnlyResolver resolver = new RegistryOnlyResolver(eas, broadcaster);
        bytes32 schemaUID = schemaRegistry.register(SCHEMA, resolver, true);
        ChainCredID registry = new ChainCredID(eas, schemaUID, broadcaster);

        resolver.bindRegistry(address(registry));
        registry.grantRole(registry.ISSUER_ROLE(), admin);
        if (admin != broadcaster) {
            registry.grantRole(registry.DEFAULT_ADMIN_ROLE(), admin);
            registry.renounceRole(registry.DEFAULT_ADMIN_ROLE(), broadcaster);
            resolver.transferOwnership(admin);
        }

        vm.stopBroadcast();

        console.log("EAS:             ", address(eas));
        console.log("SchemaRegistry:  ", address(schemaRegistry));
        console.log("Resolver:        ", address(resolver));
        console.log("ChainCredID:     ", address(registry));
        console.log("Schema UID:");
        console.logBytes32(schemaUID);
    }

    function _resolveEAS() internal returns (IEAS eas, ISchemaRegistry schemaRegistry) {
        address easAddr = vm.envOr("EAS_ADDRESS", address(0));
        if (easAddr != address(0)) {
            eas = IEAS(easAddr);
            schemaRegistry = ISchemaRegistry(vm.envAddress("SCHEMA_REGISTRY_ADDRESS"));
        } else {
            console.log("EAS_ADDRESS unset: deploying a local EAS + SchemaRegistry");
            SchemaRegistry sr = new SchemaRegistry();
            eas = new EAS(sr);
            schemaRegistry = sr;
        }
    }
}
