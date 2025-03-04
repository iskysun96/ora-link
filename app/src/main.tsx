import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/700.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { Config } from "@algorandfoundation/algokit-utils";
import { WalletId, WalletManager } from "@txnlab/use-wallet";
import { WalletProvider } from "@txnlab/use-wallet-react";
import { TARGET_NETWORK } from "./constants.ts";

const manager = new WalletManager({
  wallets: [WalletId.PERA, WalletId.DEFLY],
  // defaultNetwork: NetworkId.MAINNET // or just 'mainnet'
  network: TARGET_NETWORK,
  options: {
    // Always start on TestNet, even if the user was previously on a different network
    resetNetwork: true,
  },
});

Config.configure({
  debug: TARGET_NETWORK == 'testnet',
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider manager={manager}>
      <App />
    </WalletProvider>
  </StrictMode>
);
