# ChainCredID: assessment (September 2026)

Written before any modernization work, from a fresh clone of `maxsorto/ChainCredID` at
commit `c2199dd` (2024-03-24). Everything below is what was actually in the repo, not what the
README claims.

## 1. What it is

**One sentence:** a two-day hackathon dApp (ETH Latam 2024, San Pedro Sula) where an "admin"
flags three boolean rights per wallet address (`canVote`, `canDrink`, `canEnterCountry`), each
flag also firing an Ethereum Attestation Service (EAS) attestation on Scroll Sepolia, and a
"user" page reads those flags back.

The resume line "digital identity verification on Ethereum" is generous. What shipped is an
**issuer-controlled boolean rights registry with EAS attestations as a side effect**, plus an
unrelated Chainlink Automation voting demo added for the Chainlink sponsor track.

### Stack as found

| Layer | What is there | Notes |
|---|---|---|
| Contracts | Hardhat 2.22, Solidity `^0.8.24`, one real contract `CitizenDatabase.sol` (117 lines) | Also the untouched Hardhat template `Lock.sol` + its tests + Ignition module |
| EAS | Imports `IEAS` from `@ethereum-attestation-service/eas-contracts` | **The dependency is not in `package.json` on `main`**; `hardhat compile` fails with HH411. It was only added on the unmerged `jr` branch |
| Frontend | Four static HTML files in `front/` with inline CSS/JS, `ethers-5.2.umd.min.js` from `cdn.ethers.io` | ABI copy-pasted inline (~5 KB per page). Served by a 20-line Express server (`index.js`) |
| Hosting | `chaincredid.pages.dev` (Cloudflare Pages) | Still returns HTTP 200 as of 2026-09-16 |
| Chain | Scroll Sepolia, contract `0x981F5a4F...D3C80` | Bytecode still present (verified via `eth_getCode`) |
| Voting | `voting.html` talks to `0xf8e81D47...fBe8` "on ETH Sepolia" | `eth_getCode` on Ethereum Sepolia returns `0x`: no contract at that address. Its source (`VotingContract.sol`) only exists on the `jr` branch, never merged |
| Tests | `test/Lock.js` (Hardhat template) | Zero tests for `CitizenDatabase` |
| CI | none | |

### Commit history

32 commits over 10 days (2024-03-14 to 03-24). Three authors:

- **Max Sorto** (5 commits): initial commit, `CitizenDatabase.sol`, the front-end MVP
  (`user.html`, `admin.html`), Hardhat scaffold, voting frontend.
- **cc0mfer** (7 commits): homepage, logo, README, one "test deploy".
- **Jorge Ramirez / jrmaktub** (20 commits): almost all README churn and `voting.html` tweaks
  on 03-23/24, plus the Chainlink voting work on the `jr` branch.

So the identity/attestation core is Max's; the Chainlink voting side-quest is Jorge's.

### Does it work?

- `npm install` succeeds (605 packages). `npx hardhat compile` **fails** (missing EAS dep).
  Hardhat 2.22 also warns Node 22 is unsupported.
- `npm test` is the default `exit 1` stub.
- Frontend "builds" trivially (static HTML) but depends on `cdn.ethers.io`, which is deprecated
  and the ethers v5 UMD build.
- **No secrets or private keys anywhere in history** (grepped all branches for key/mnemonic/
  64-hex patterns). Only public contract addresses and the EAS schema UID are hardcoded.
- Dead weight: `Lock.sol`, `test/Lock.js`, `ignition/`, `express`, duplicated `node_modules`
  line in `.gitignore`, `package.json` `main` pointing to a static file server.

### Correctness problems in `CitizenDatabase.sol`

These matter because an interviewer who opens the contract will see them in 30 seconds:

1. **No access control.** `addCitizen` and all three `attest*` functions are `public` with no
   role check. Anyone can grant anyone the right to vote.
2. **Broken guard.** `require(!citizens[x].canVote); citizens[x].canVote = _canVote;` means
   calling with `_canVote = false` passes the guard, writes nothing useful, and still emits an
   EAS attestation. The bool parameter is effectively meaningless.
3. **Attestation payload is just the address.** `data: abi.encode(_userAddress)` for all three
   rights, so the on-chain attestation does not say *which* right was attested. Three functions
   produce indistinguishable attestations against one schema.
4. **Non-revocable, no expiry.** Rights that obviously expire or get revoked (entry permission,
   voting eligibility) are attested as `revocable: false`, `NO_EXPIRATION_TIME`.
5. **Duplicated state.** The `citizens` mapping mirrors what EAS already stores, and the
   `verify*` functions read the mapping, never EAS. The attestations are decorative.
6. Hardcoded EAS address and schema UID as mutable storage without a setter (so: hardcoded, but
   costs a storage slot). Three copy-pasted 20-line functions.

None of this is embarrassing *for a 48-hour hackathon*. It is embarrassing as a live resume link
in 2026.

## 2. Does the idea have value in September 2026?

Short version: the *problem* (portable, verifiable claims about an entity) is more relevant than
in 2024, but the *specific approach* (a government admin flipping booleans per wallet) is the
part of the design space that has moved on the most.

### Where the landscape went

- **EAS won the attestation layer.** It is an OP Stack predeploy (`0x4200...0021` on Base,
  Optimism, and every superchain L2), the substrate for Coinbase Verifications (onchain KYC
  attestations, 77k+ verified users early on and now the default "is this wallet a verified
  Coinbase account" signal on Base), Gitcoin Passport, Optimism RetroPGF badges, and most
  Farcaster/onchain-social reputation. Betting on EAS in March 2024 was the correct call.
  ChainCredID's use of it (attest a bare address, never read it back) was not.
- **Government/civil identity moved to zk-proofs of real documents.** World ID (biometric
  orb, ~15M+ verified), zkPassport (NFC passport chip + ZK proof, SDK v0.16 shipped July 2026,
  mainnet contracts live), Self Protocol (same idea, Celo-origin, pivoted toward
  age/nationality/sanctions disclosures). All three prove "over 18", "citizen of X", "not on
  a sanctions list" without an issuer ever seeing the wallet. That is exactly the
  `canVote / canDrink / canEnterCountry` use case, done properly. A centralised admin
  contract that grants these flags is now the strawman these projects are built against.
- **Onchain KYC became a product, not a hackathon idea.** Coinbase Verifications, Base
  Verify, and the `verified account` / `verified country` schemas are live and free to
  consume. "Digital identity verification on Ethereum" now reads as "I re-implemented a worse
  Coinbase Verifications".
- **Smart accounts are the default wallet.** EIP-7702 shipped in Pectra (May 2025). EOAs
  delegate to code; session keys with spend/time/target policies (ZeroDev, Pimlico, Openfort,
  Coinbase Smart Wallet) are production infrastructure. Credentials increasingly attach to
  an *account* that can also hold policy, not a bare address.
- **Passkeys replaced seed phrases for consumer wallets.** WebAuthn/P-256 signers behind
  ERC-4337/7702 accounts (Coinbase Smart Wallet, Privy, Turnkey) are standard. A MetaMask-only
  `window.ethereum` frontend is a 2022 artefact.
- **The new identity problem is agents, not citizens.** ERC-8004 "Trustless Agents"
  (Identity + Reputation + Validation registries; co-authored by MetaMask, EF, Google,
  Coinbase engineers) went live on Ethereum mainnet on 29 Jan 2026 and is deployed across
  Base, OP, Arbitrum, Scroll and others. x402 (HTTP 402 stablecoin payments) reported ~69k
  active agents and 165M transactions by April 2026. Google AP2, Stripe/Tempo MPP,
  Mastercard Agent Pay, Visa Trusted Agent Protocol and Circle Agent Stack all launched in
  the same window. "Know Your Agent" (KYA) is the term of art: agent identity + authority
  binding + runtime controls + audit trail. This is unsolved, it is where the money is, and
  it is the exact intersection of Max's current job (payments, agentic systems) and this
  repo's nominal topic (credentials).

### Where ChainCredID sits

| | 2024 ChainCredID | Stale? | Still interesting? |
|---|---|---|---|
| EAS as attestation layer | yes | no, correct bet | yes, keep |
| Scroll L2 | yes | Scroll is fine but Base is where EAS consumers and Coinbase Verifications live | move to Base (Sepolia) |
| Admin grants rights per address | yes | very: zk document proofs made this the anti-pattern | drop the framing |
| Voting/drinking/entry-permission use case | yes | yes; solved by World ID/zkPassport/Self | keep only as the "2024 demo" story |
| Chainlink Automation voting | jr branch | yes; sponsor-track filler | drop |
| Three copy-pasted bool functions | yes | yes | replace with a generic credential type |
| ethers v5 UMD + MetaMask-only | yes | very | viem/wagmi, injected + passkey-friendly |
| Attestation payload = bare address | yes | yes | typed schema, revocable, expiring |
| Reading EAS back for verification | no (reads its own mapping) | | the whole point; add it |

The salvageable core: **an issuer-gated EAS schema for typed, revocable, expiring credentials,
plus a verifier that reads EAS.** That is a legitimate primitive that every direction below
builds on.

## 3. Directions

### A. Agent Credential Registry (recommended)

Reposition from "citizen rights" to **credentials for AI agents and the humans that deploy
them**, on Base Sepolia, with EAS underneath.

- The issuer-gated `ChainCredID` contract issues typed, revocable, expiring EAS attestations
  where the *subject* is an agent (an ERC-8004 `agentId` resolved to its agent wallet) or a
  human operator wallet, and the *credential type* is a policy-relevant claim: `OPERATOR_KYC`,
  `SPEND_LIMIT_USDC_1000`, `ALLOWED_MERCHANT_CATEGORY`, `INSURED`, `AUDITED_v1`.
- A tiny **verifier** (Solidity view + TypeScript) answers `hasCredential(subject, type)`
  by reading EAS: exists, not revoked, not expired, issuer is trusted.
- An **MCP server** (`@modelcontextprotocol/sdk`) exposes `verify_credential`,
  `list_credentials`, and `request_credential` as tools, so a Claude/OpenClaw/Hermes agent
  can gate its own actions ("before paying this merchant, check they hold `MERCHANT_VERIFIED`")
  or a payments backend can ask "is this agent's operator KYC'd before I settle the x402
  request?". That is the piece that ties it to Max's day job.
- Reputation stays on ERC-8004; credentials (issuer-signed claims) live here. The README
  explains the split, which is exactly the kind of design judgement interviewers probe.

Why this one: it keeps every real asset (EAS, the hackathon win, the contract lineage),
deletes the parts that aged badly, and lands squarely on "zero-to-one agentic build,
payments-adjacent, revenue-minded" (KYA is a compliance line item at every payments company
onboarding agents). It also gives a crisp interview story: "won a hackathon with an identity
idea in 2024, watched the market move to agents, re-cut it in 2026."

**Done in a weekend looks like:**
1. Contracts (Foundry): `ChainCredID.sol` with `AccessControl`, generic `bytes32
   credentialType`, `issue / revoke / hasCredential / getCredential`, EAS schema resolver
   that enforces issuer role; ~15 Forge tests against real EAS bytecode deployed in-test;
   deploy script for Base Sepolia. (Saturday morning; most of this is done in Phase 2.)
2. `mcp/` package: stdio MCP server with `verify_credential` + `list_credentials` reading
   via viem from Base Sepolia, `issue_credential` gated behind an env-provided issuer key
   (testnet only). One integration test. (Saturday afternoon.)
3. `web/`: Next.js 16 + wagmi 3: `/verify` (paste an address or ERC-8004 agentId, see
   credentials with live EAS links), `/issue` (issuer role only). Deployed to Cloudflare
   Pages at the existing `chaincredid.pages.dev`. (Sunday.)
4. README with the architecture diagram, a 60-second demo GIF of Claude Code calling
   `verify_credential` before a mock payment, Base Sepolia addresses, EAS schema link.

### B. Selective-disclosure credentials (zk)

Keep the "citizen rights" story but make it honest: integrate zkPassport (or Self) so a user
proves `age >= 18` / `nationality == HN` in-browser, and the contract mints an EAS
attestation *from the proof* instead of from an admin. Strong crypto story, directly answers
"why not just trust the admin". Downside: it is a zkPassport integration demo, the
interesting work is theirs, and it does not connect to Max's agentic/payments narrative.
More than a weekend once you handle proof verification on-chain properly.

### C. Minimal honest modernization only

Fix the six contract bugs, Foundry + tests, viem/wagmi frontend, README, CI. Keep the
"citizen rights" demo. This is Phase 2 of this task. Worth doing regardless, but on its own
it turns a stale hackathon repo into a tidy stale hackathon repo. Keep it as the floor, not
the destination.

### Recommendation

**A**, with C as the foundation (done now) and B noted in the roadmap as the answer to
"how do humans get their `OPERATOR_KYC` credential without trusting an admin".

### Resume implication

Keep the award. Re-word the project. "Digital identity verification on Ethereum" undersells
the win and oversells the code. After A ships, the line should say what it is now: an
EAS-based credential registry with an MCP verifier that lets agents and payment backends
check issuer-signed claims before acting.
