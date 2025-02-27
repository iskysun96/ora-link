import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/700.css";

import { WalletManager, WalletId, NetworkId } from "@txnlab/use-wallet";
import { WalletProvider } from "@txnlab/use-wallet-react";
import { Config } from "@algorandfoundation/algokit-utils";

const manager = new WalletManager({
  wallets: [WalletId.PERA, WalletId.DEFLY],
  // defaultNetwork: NetworkId.MAINNET // or just 'mainnet'
  network: NetworkId.TESTNET,
  options: {
    // Always start on TestNet, even if the user was previously on a different network
    resetNetwork: true,
  },
});


Config.configure({
  debug: true,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider manager={manager}>
      <App />
    </WalletProvider>
  </StrictMode>
);
