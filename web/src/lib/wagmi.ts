import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { baseSepolia, foundry } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Supported chains. Base Sepolia is the default target (EAS is an OP Stack predeploy there);
 * `foundry` is a local anvil node for `forge script` + `next dev` loops.
 */
export const chains = [baseSepolia, foundry] as const;

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected()],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
    [foundry.id]: http("http://127.0.0.1:8545"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
