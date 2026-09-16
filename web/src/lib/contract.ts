import { type Address, type Hex, isAddress, keccak256, parseAbi, stringToBytes } from "viem";
import { baseSepolia, foundry } from "wagmi/chains";

/** Human-readable ABI for the parts of ChainCredID the UI touches. Keep in sync with contracts/src. */
export const chainCredIdAbi = parseAbi([
  "function ISSUER_ROLE() view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function eas() view returns (address)",
  "function schemaUID() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function hasCredential(address subject, bytes32 credentialType) view returns (bool)",
  "function credentialUID(address subject, bytes32 credentialType) view returns (bytes32)",
  "function getCredential(address subject, bytes32 credentialType) view returns ((bytes32 uid, bytes32 schema, uint64 time, uint64 expirationTime, uint64 revocationTime, bytes32 refUID, address recipient, address attester, bool revocable, bytes data) attestation, string metadataURI, bool active)",
  "function issue(address subject, bytes32 credentialType, uint64 expirationTime, string metadataURI) returns (bytes32 uid)",
  "function revoke(address subject, bytes32 credentialType)",
  "event CredentialIssued(address indexed subject, bytes32 indexed credentialType, bytes32 indexed uid, address issuer, uint64 expirationTime, string metadataURI)",
  "event CredentialRevoked(address indexed subject, bytes32 indexed credentialType, bytes32 indexed uid, address revoker)",
]);

/**
 * Deployed registry addresses per chain, from env. Unset chains are simply not offered.
 * NEXT_PUBLIC_* values are public by design (contract addresses, RPC URLs). Never put keys here.
 */
export const registryAddresses: Partial<Record<number, Address>> = {
  [baseSepolia.id]: envAddress(process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_BASE_SEPOLIA),
  [foundry.id]: envAddress(process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_LOCAL),
};

function envAddress(value: string | undefined): Address | undefined {
  return value && isAddress(value) ? value : undefined;
}

/** Mirrors `ChainCredID.credentialType(string)`: keccak256 of the UTF-8 name. */
export function credentialTypeId(name: string): Hex {
  return keccak256(stringToBytes(name));
}

/**
 * Example credential types. The contract is type-agnostic; these are the ones the demo UI offers.
 * Names are the 2026 repositioning (agent / operator credentials). The 2024 hackathon shipped
 * `canVote`, `canDrink`, `canEnterCountry` as three hardcoded booleans.
 */
export const exampleCredentialTypes = [
  { name: "OPERATOR_KYC", label: "Operator KYC", blurb: "The human or company behind this wallet passed issuer KYC." },
  { name: "AGENT_REGISTERED", label: "Agent registered", blurb: "Wallet is bound to an ERC-8004 agent registration the issuer reviewed." },
  { name: "SPEND_LIMIT_USDC_1000", label: "Spend limit: 1,000 USDC", blurb: "Issuer vouches this agent may settle up to 1,000 USDC per period." },
  { name: "MERCHANT_VERIFIED", label: "Merchant verified", blurb: "Counterparty is a verified merchant; safe to pay via x402." },
] as const;

export const easScanBase: Partial<Record<number, string>> = {
  [baseSepolia.id]: "https://base-sepolia.easscan.org",
};

export function easAttestationUrl(chainId: number, uid: Hex): string | undefined {
  const base = easScanBase[chainId];
  return base ? `${base}/attestation/view/${uid}` : undefined;
}

export const ZERO_BYTES32 = `0x${"0".repeat(64)}` as Hex;
