// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { IAccessControl } from "@openzeppelin/contracts/access/IAccessControl.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import {
    IEAS,
    AttestationRequest,
    AttestationRequestData,
    RevocationRequest,
    RevocationRequestData
} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { EAS } from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";
import {
    SchemaRegistry
} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
import {
    Attestation,
    EMPTY_UID,
    NO_EXPIRATION_TIME
} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";

import { ChainCredID } from "../src/ChainCredID.sol";
import { RegistryOnlyResolver } from "../src/RegistryOnlyResolver.sol";

/// Runs against the real EAS + SchemaRegistry bytecode deployed in setUp, not a mock.
contract ChainCredIDTest is Test {
    SchemaRegistry internal schemaRegistry;
    EAS internal eas;
    RegistryOnlyResolver internal resolver;
    ChainCredID internal registry;
    bytes32 internal schemaUID;

    address internal admin = makeAddr("admin");
    address internal issuer = makeAddr("issuer");
    address internal stranger = makeAddr("stranger");
    address internal agent = makeAddr("agent-wallet");

    bytes32 internal constant KYC = keccak256("OPERATOR_KYC");
    bytes32 internal constant SPEND = keccak256("SPEND_LIMIT_USDC_1000");
    string internal constant URI = "ipfs://bafy.../evidence.json";

    function setUp() public {
        schemaRegistry = new SchemaRegistry();
        eas = new EAS(schemaRegistry);

        resolver = new RegistryOnlyResolver(eas, admin);
        schemaUID =
            schemaRegistry.register("bytes32 credentialType,string metadataURI", resolver, true);
        registry = new ChainCredID(eas, schemaUID, admin);

        vm.startPrank(admin);
        resolver.bindRegistry(address(registry));
        registry.grantRole(registry.ISSUER_ROLE(), issuer);
        vm.stopPrank();

        vm.warp(1_800_000_000); // deterministic "now"
    }

    // ------------------------------------------------------------------ constructor

    function test_constructor_setsImmutablesAndAdmin() public view {
        assertEq(address(registry.eas()), address(eas));
        assertEq(registry.schemaUID(), schemaUID);
        assertTrue(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), admin));
        assertFalse(registry.hasRole(registry.ISSUER_ROLE(), admin));
    }

    function test_constructor_revertsOnZeroInputs() public {
        vm.expectRevert(ChainCredID.ZeroAddress.selector);
        new ChainCredID(IEAS(address(0)), schemaUID, admin);
        vm.expectRevert(ChainCredID.ZeroAddress.selector);
        new ChainCredID(eas, schemaUID, address(0));
        vm.expectRevert(ChainCredID.ZeroSchema.selector);
        new ChainCredID(eas, EMPTY_UID, admin);
    }

    // ------------------------------------------------------------------ issue

    function test_issue_attestsOnEASWithTypedPayload() public {
        uint64 exp = uint64(block.timestamp + 30 days);

        vm.prank(issuer);
        vm.expectEmit(true, true, false, true);
        emit ChainCredID.CredentialIssued(agent, KYC, bytes32(0), issuer, exp, URI);
        bytes32 uid = registry.issue(agent, KYC, exp, URI);

        assertTrue(uid != EMPTY_UID);
        assertEq(registry.credentialUID(agent, KYC), uid);
        assertTrue(registry.hasCredential(agent, KYC));
        assertFalse(registry.hasCredential(agent, SPEND), "other types untouched");

        Attestation memory a = eas.getAttestation(uid);
        assertEq(a.schema, schemaUID);
        assertEq(a.recipient, agent);
        assertEq(a.attester, address(registry), "registry is the attester");
        assertEq(a.expirationTime, exp);
        assertTrue(a.revocable);
        assertEq(a.refUID, EMPTY_UID);
        (bytes32 decodedType, string memory decodedURI) = abi.decode(a.data, (bytes32, string));
        assertEq(decodedType, KYC, "credential type is in the attestation, not just the address");
        assertEq(decodedURI, URI);
    }

    function test_issue_noExpiryIsAllowed() public {
        vm.prank(issuer);
        registry.issue(agent, KYC, NO_EXPIRATION_TIME, "");
        vm.warp(block.timestamp + 100 * 365 days);
        assertTrue(registry.hasCredential(agent, KYC));
    }

    function test_issue_revertsForNonIssuer() public {
        bytes32 role = registry.ISSUER_ROLE(); // read before prank: the prank applies to the next call
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, role
            )
        );
        registry.issue(agent, KYC, 0, "");
    }

    function test_issue_adminIsNotAutomaticallyIssuer() public {
        vm.prank(admin);
        vm.expectRevert();
        registry.issue(agent, KYC, 0, "");
    }

    function test_issue_revertsOnZeroSubject() public {
        vm.prank(issuer);
        vm.expectRevert(ChainCredID.ZeroAddress.selector);
        registry.issue(address(0), KYC, 0, "");
    }

    function test_issue_revertsOnPastExpiration() public {
        uint64 past = uint64(block.timestamp - 1);
        vm.prank(issuer);
        vm.expectRevert(
            abi.encodeWithSelector(ChainCredID.ExpirationInPast.selector, past, block.timestamp)
        );
        registry.issue(agent, KYC, past, "");

        // exactly-now is also in the past for an expiring attestation
        uint64 nowTs = uint64(block.timestamp);
        vm.prank(issuer);
        vm.expectRevert(
            abi.encodeWithSelector(ChainCredID.ExpirationInPast.selector, nowTs, block.timestamp)
        );
        registry.issue(agent, KYC, nowTs, "");
    }

    function test_issue_revertsWhileActive() public {
        vm.startPrank(issuer);
        bytes32 uid = registry.issue(agent, KYC, 0, "");
        vm.expectRevert(
            abi.encodeWithSelector(ChainCredID.CredentialAlreadyActive.selector, agent, KYC, uid)
        );
        registry.issue(agent, KYC, 0, "");
        vm.stopPrank();
    }

    // ------------------------------------------------------------------ expiry & re-issue

    function test_hasCredential_falseAfterExpiry() public {
        uint64 exp = uint64(block.timestamp + 1 days);
        vm.prank(issuer);
        registry.issue(agent, KYC, exp, "");

        vm.warp(exp - 1);
        assertTrue(registry.hasCredential(agent, KYC));
        vm.warp(exp);
        assertFalse(registry.hasCredential(agent, KYC), "inactive at the expiry second");
    }

    function test_reissueAfterExpiry_linksPredecessorViaRefUID() public {
        uint64 exp = uint64(block.timestamp + 1 days);
        vm.prank(issuer);
        bytes32 first = registry.issue(agent, KYC, exp, "");

        vm.warp(exp + 1);
        vm.prank(issuer);
        bytes32 second = registry.issue(agent, KYC, 0, "");

        assertTrue(second != first);
        assertEq(eas.getAttestation(second).refUID, first);
        assertEq(registry.credentialUID(agent, KYC), second);
        assertTrue(registry.hasCredential(agent, KYC));
    }

    // ------------------------------------------------------------------ revoke

    function test_revoke_marksRevokedOnEAS() public {
        vm.startPrank(issuer);
        bytes32 uid = registry.issue(agent, KYC, 0, URI);

        vm.expectEmit(true, true, true, true);
        emit ChainCredID.CredentialRevoked(agent, KYC, uid, issuer);
        registry.revoke(agent, KYC);
        vm.stopPrank();

        assertFalse(registry.hasCredential(agent, KYC));
        assertEq(registry.credentialUID(agent, KYC), uid, "uid kept for audit");
        assertEq(eas.getAttestation(uid).revocationTime, block.timestamp);

        (Attestation memory a, string memory uri, bool active) = registry.getCredential(agent, KYC);
        assertEq(a.uid, uid);
        assertEq(uri, URI);
        assertFalse(active);
    }

    function test_revoke_thenReissueWorks() public {
        vm.startPrank(issuer);
        bytes32 first = registry.issue(agent, KYC, 0, "");
        registry.revoke(agent, KYC);
        bytes32 second = registry.issue(agent, KYC, 0, "");
        vm.stopPrank();

        assertTrue(second != first);
        assertEq(eas.getAttestation(second).refUID, first);
        assertTrue(registry.hasCredential(agent, KYC));
    }

    function test_revoke_revertsWithoutActiveCredential() public {
        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(ChainCredID.NoActiveCredential.selector, agent, KYC));
        registry.revoke(agent, KYC);
    }

    function test_revoke_revertsOnAlreadyRevoked() public {
        vm.startPrank(issuer);
        registry.issue(agent, KYC, 0, "");
        registry.revoke(agent, KYC);
        vm.expectRevert(abi.encodeWithSelector(ChainCredID.NoActiveCredential.selector, agent, KYC));
        registry.revoke(agent, KYC);
        vm.stopPrank();
    }

    function test_revoke_revertsForNonIssuer() public {
        vm.prank(issuer);
        registry.issue(agent, KYC, 0, "");
        vm.prank(stranger);
        vm.expectRevert();
        registry.revoke(agent, KYC);
    }

    // ------------------------------------------------------------------ views

    function test_getCredential_emptyWhenNeverIssued() public view {
        (Attestation memory a, string memory uri, bool active) = registry.getCredential(agent, KYC);
        assertEq(a.uid, EMPTY_UID);
        assertEq(bytes(uri).length, 0);
        assertFalse(active);
    }

    function test_credentialTypeId_matchesKeccak() public view {
        assertEq(registry.credentialTypeId("OPERATOR_KYC"), KYC);
    }

    // ------------------------------------------------------------------ resolver (closed schema)

    function test_resolver_rejectsAttestationsNotFromRegistry() public {
        vm.prank(stranger);
        vm.expectRevert(); // EAS bubbles InvalidAttestation when the resolver returns false
        eas.attest(
            AttestationRequest({
                schema: schemaUID,
                data: AttestationRequestData({
                    recipient: agent,
                    expirationTime: 0,
                    revocable: true,
                    refUID: EMPTY_UID,
                    data: abi.encode(KYC, ""),
                    value: 0
                })
            })
        );
        assertFalse(registry.hasCredential(agent, KYC));
    }

    function test_resolver_bindRegistryIsOneShotAndOwnerOnly() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        resolver.bindRegistry(stranger);

        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                RegistryOnlyResolver.RegistryAlreadyBound.selector, address(registry)
            )
        );
        resolver.bindRegistry(stranger);

        assertEq(resolver.registry(), address(registry));
    }

    function test_resolver_rejectsEverythingBeforeBinding() public {
        RegistryOnlyResolver unbound = new RegistryOnlyResolver(eas, admin);
        bytes32 openSchema = schemaRegistry.register("bytes32 t,string u", unbound, true);
        vm.prank(stranger);
        vm.expectRevert();
        eas.attest(
            AttestationRequest({
                schema: openSchema,
                data: AttestationRequestData({
                    recipient: agent,
                    expirationTime: 0,
                    revocable: true,
                    refUID: EMPTY_UID,
                    data: abi.encode(KYC, ""),
                    value: 0
                })
            })
        );
    }

    // ------------------------------------------------------------------ fuzz

    function testFuzz_issueThenVerify(address subject, bytes32 credType, uint64 ttl) public {
        vm.assume(subject != address(0));
        ttl = uint64(bound(ttl, 1, 365 days * 10));
        uint64 exp = uint64(block.timestamp) + ttl;

        vm.prank(issuer);
        bytes32 uid = registry.issue(subject, credType, exp, "");

        assertTrue(registry.hasCredential(subject, credType));
        assertEq(eas.getAttestation(uid).recipient, subject);

        vm.warp(exp);
        assertFalse(registry.hasCredential(subject, credType));
    }

    function testFuzz_onlyIssuerRoleCanIssue(address caller) public {
        vm.assume(caller != issuer);
        vm.prank(caller);
        vm.expectRevert();
        registry.issue(agent, KYC, 0, "");
    }
}
