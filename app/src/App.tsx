import { useWallet } from "@txnlab/use-wallet-react";
import Button from "./components/Button";
import Header from "./Header";
import { Separator } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { OLinkFactory } from "./lib/OLinkClient";

import algosdk from "algosdk";
import { extractShortcodeFromUrl } from "./lib/utils";
import LocationRedirectPanel from "./LocationRedirectPanel";

const appId = BigInt(734703029); // Your app ID

function App() {
  const { activeAccount, transactionSigner, algodClient } = useWallet();

  const [shortcode, setShortcode] = useState("");
  const [url, setUrl] = useState("");

  const [customShortcode, setCustomShortcode] = useState("");
  const [useCustomShortcode, setUseCustomShortcode] = useState(false);

  const [resolvedShortcode, setResolvedShortcode] = useState<string>();
  const [resolvedShortCodeCreated, setResolvedShortCodeCreated] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>();

  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationUrl, setLocationUrl] = useState<string>();

  const appClient = useMemo(() => {
    const algorand = AlgorandClient.testNet();
    const olinkFactory = new OLinkFactory({
      algorand: algorand,
    });

    const appClient = olinkFactory.getAppClientById({
      appId,
      defaultSender: activeAccount?.address,
      defaultSigner: transactionSigner,
    });
    return appClient;
  }, [activeAccount, transactionSigner]);

  const resolvedShortcodeURL = useMemo(() => {
    if (resolvedShortcode) {
      return `${window.location.href}#${resolvedShortcode}`;
    }
    return undefined;
  }, [resolvedShortcode]);

  useEffect(() => {
    const checkLocation = async () => {
      setCheckingLocation(true);
      const location = window.location.href;
      const shortcode = extractShortcodeFromUrl(location);
      console.log("Location shortcode:", shortcode);
      if (shortcode) {
        // setShortcode(shortcode);
        try {
          const resolvedUrl = await appClient.resolveShortcode({ args: [shortcode] });
          setLocationUrl(resolvedUrl);
          console.log("Location URL:", resolvedUrl);
        } catch (error) {
          console.error("Invalid shortcode:", error);
        }
      }
      setCheckingLocation(false);
    };
    checkLocation();

    window.addEventListener("hashchange", checkLocation);
    return () => {
      window.removeEventListener("hashchange", checkLocation);
    };
  }, []);

  const resolveShortcode = async (shortcode: string) => {
    if (!appClient || !activeAccount || !transactionSigner) return;

    try {
      const result = await appClient.resolveShortcode({
        args: [shortcode],
        sender: activeAccount.address,
        signer: transactionSigner,
      });

      console.log(result);
      setResolvedUrl(result);
    } catch (error) {
      console.error("Error resolving shortcode:", error);
    }
  };

  const shortenUrl = async (url: string) => {
    if (!appClient || !activeAccount || !transactionSigner) return;

    try {
      const suggestedParams = await algodClient.getTransactionParams().do();

      const mbrAmount = 2500 + 400 * (url.length + 8 + 4);

      const mbrPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAccount.address,
        to: algosdk.getApplicationAddress(appId),
        amount: mbrAmount,
        suggestedParams,
      });

      const res = await appClient.send.createShortcode({
        args: [mbrPayment, url],
        populateAppCallResources: true,
      });

      console.log(res.return);

      if (res.return) {
        setResolvedShortcode(res.return);
        setResolvedShortCodeCreated(true);
      }
    } catch (error) {
      console.error("Error resolving shortcode:", error);

      try {
        const res = await appClient.send.findShortcode({
          args: [url],
          sender: activeAccount.address,
          signer: transactionSigner,
        });
        if (res.return) {
          setResolvedShortcode(res.return);
          setResolvedShortCodeCreated(false);
        }
      } catch (error) {
        console.error("Error finding shortcode:", error);
      }
    }
  };

  const customShortenUrl = async (customShortCode: string, url: string) => {
    if (!appClient || !activeAccount || !transactionSigner) return;

    try {
      const suggestedParams = await algodClient.getTransactionParams().do();

      const mbrAmount = 2500 + 400 * (url.length + customShortCode.length + 4);

      const mbrPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAccount.address,
        to: algosdk.getApplicationAddress(appId),
        amount: mbrAmount,
        suggestedParams,
      });

      const oraAsaId = await appClient.state.global.oraAsaId();
      const customLinkPrice = await appClient.state.global.customLinkPrice();

      console.log("oraAsaId", oraAsaId, "customLinkPrice", customLinkPrice);

      if (!oraAsaId || !customLinkPrice) return;

      const oraPayment = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: activeAccount.address,
        to: algosdk.getApplicationAddress(appId),
        assetIndex: Number(oraAsaId),
        amount: customLinkPrice,
        suggestedParams,
      });

      const res = await appClient.send.createCustomShortcode({
        args: [mbrPayment, oraPayment, customShortCode, url],
        populateAppCallResources: true,
      });

      console.log(res.return);

      if (res.return) {
        setResolvedShortcode(res.return);
        setResolvedShortCodeCreated(true);
      }
    } catch (error) {
      console.error("Error creating custom shortcode:", error);
    }
  };

  return (
    <div className="h-screen w-screen flex justify-center m-0 p-0">
      {checkingLocation ? (
        <div>Loading...</div>
      ) : locationUrl ? (
        <LocationRedirectPanel locationUrl={locationUrl} />
      ) : (
        <>
          <Header />

          <div className="flex flex-col min-w-96 self-center m-auto rounded-xl bg-orange-200 drop-shadow-sm">
            <div className="text-base w-full rounded-t-xl bg-orange-500 text-orange-100 p-1 text-center">ORANGE LINK</div>

            <div className="p-4 text-left text-sm flex flex-col">
              <div className="mb-4">
                <div>Shortcode to resolve:</div>
                <input
                  type="text"
                  className="w-full p-2 text-sm rounded border border-orange-400 bg-orange-100/90 focus:outline-none"
                  value={shortcode}
                  onChange={(e) => setShortcode(e.target.value)}
                />
                {resolvedUrl && (
                  <div className="text-sm text-orange-500">
                    Resolved URL:{" "}
                    <a className="hover:underline" href={resolvedUrl} target="_blank" rel="noopener noreferrer">
                      {resolvedUrl}
                    </a>
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  resolveShortcode(shortcode);
                }}
                text="Resolve"
                disabled={shortcode.length === 0 || activeAccount === undefined}
              />
            </div>

            <Separator.Root className="bg-orange-400 my-4 mx-4 h-px" orientation="horizontal" />

            <div className="p-4 text-left text-sm flex flex-col">
              <div className="mb-4">
                <div>URL to shorten:</div>
                <input
                  type="text"
                  className="w-full p-2 text-sm rounded border border-orange-400 bg-orange-100/90 focus:outline-none"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setResolvedShortcode(undefined);
                    setResolvedShortCodeCreated(false);
                  }}
                />
                <div className="rounded bg-orange-300 p-4 mt-4">
                  <div className="flex gap-2 mb-2">
                    <input
                      id="useCustomShortcode"
                      type="checkbox"
                      onChange={(e) => setUseCustomShortcode(e.target.checked)}
                      checked={useCustomShortcode}
                    />
                    <label htmlFor="useCustomShortcode">Use custom shortcode (Cost: 1 ORA)</label>
                  </div>
                  <div>Custom Shortcode:</div>
                  <input
                    type="text"
                    className="w-full p-2 text-sm rounded border border-orange-400 bg-orange-100/90 focus:outline-none disabled:bg-orange-200"
                    value={customShortcode}
                    disabled={!useCustomShortcode}
                    onChange={(e) => setCustomShortcode(e.target.value)}
                  />
                </div>
                {resolvedShortcode && (
                  <div className="rounded bg-orange-300 p-4 mt-4">
                    <div className="text-sm font-bold">
                      {resolvedShortCodeCreated ? "Created shortcode: " : "Existing shortcode: "} {resolvedShortcode}
                    </div>
                    <div>Shareable Link:</div>
                    <div>
                      <a className="hover:underline" href={resolvedShortcodeURL} target="_blank" rel="noopener noreferrer">
                        {resolvedShortcodeURL}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  if (useCustomShortcode) {
                    customShortenUrl(customShortcode, url);
                  } else {
                    shortenUrl(url);
                  }
                }}
                text="Shorten"
                disabled={url.length === 0 || activeAccount === undefined || (useCustomShortcode && customShortcode.length == 0)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
