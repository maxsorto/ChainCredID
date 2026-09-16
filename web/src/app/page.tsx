import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { Flow } from "@/components/landing/Flow";
import { ScenePay } from "@/components/landing/ScenePay";
import { SceneExpiry } from "@/components/landing/SceneExpiry";
import { SceneSpend } from "@/components/landing/SceneSpend";
import { SceneReaders } from "@/components/landing/SceneReaders";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Flow />

      <section className="mx-auto w-full max-w-6xl px-5 pt-6">
        <div className="rule" />
        <div className="pt-8">
          <p className="eyebrow">Four credentials, four situations</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold md:text-3xl">
            The contract is <span className="whitespace-nowrap">type-agnostic</span>. These are the credentials the demo issues, each shown doing its&nbsp;job.
          </h2>
        </div>
        <div className="divide-y divide-line">
          <ScenePay />
          <SceneExpiry />
          <SceneSpend />
          <SceneReaders />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="rule" />
        <div className="grid gap-8 pt-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <div>
            <p className="eyebrow">Why this exists in 2026</p>
            <h2 className="mt-3 text-2xl font-semibold md:text-3xl">The new identity problem is agents, not&nbsp;citizens.</h2>
          </div>
          <div className="grid gap-6 text-[15px] leading-relaxed text-ink-2 sm:grid-cols-3">
            <p>
              <b className="text-ink">Agents now hold wallets and pay.</b> ERC-8004 gives an agent an onchain identity and
              reputation. x402 lets it pay over HTTP with stablecoins. What neither answers is who vouches for the agent,
              or for the merchant it is about to&nbsp;pay.
            </p>
            <p>
              <b className="text-ink">EAS is the substrate that won.</b> It is a predeploy on Base and the OP Stack and
              already carries Coinbase Verifications and most onchain reputation. A credential written here is readable
              by every tool that already reads&nbsp;EAS.
            </p>
            <p>
              <b className="text-ink">Know Your Agent needs a claims layer.</b> Identity says who. Reputation says how
              they behaved. ChainCredID is the third piece: an <span className="whitespace-nowrap">issuer-signed</span>, revocable claim that a wallet passed a
              check, with the evidence linked and the history&nbsp;kept.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="rounded-2xl border border-line bg-paper-2 p-6 md:p-10">
          <div className="grid items-center gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div>
              <p className="eyebrow">Run it</p>
              <h2 className="mt-3 text-2xl font-semibold md:text-3xl">Deploy to anvil in one command, then verify a&nbsp;wallet.</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-2">
                Foundry deploys a local EAS, registers the closed schema, and binds the registry. The web app reads it
                on chain 31337. Roadmap: an MCP server so agents call verify_credential directly, and a Base Sepolia
                deployment.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/verify" className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:opacity-90">
                  Verify a wallet
                </Link>
                <a
                  href="https://github.com/maxsorto/ChainCredID#run-it-locally"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-line-2 px-4 py-2.5 text-sm font-medium hover:border-ink"
                >
                  Read the setup
                </a>
              </div>
            </div>
            <pre className="term whitespace-pre-wrap p-4 text-[12px] leading-relaxed">
              <code>{`forge test            # 23 tests, real EAS bytecode
anvil
forge script script/Deploy.s.sol \\
  --rpc-url anvil --broadcast \\
  --unlocked --sender 0xf39F…2266
cd ../web && npm run dev   # /verify on chain 31337`}</code>
            </pre>
          </div>
        </div>
      </section>
    </>
  );
}
