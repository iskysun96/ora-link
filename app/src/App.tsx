import { useWallet } from "@txnlab/use-wallet-react";
import Button from "./components/Button";
import Header from "./Header";
import { Separator, Tooltip } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import { OLinkFactory } from "./lib/OLinkClient";

import algosdk from "algosdk";
import { extractShortcodeFromUrl } from "./lib/utils";
import LocationRedirectPanel from "./LocationRedirectPanel";
import { APP_CONFIG } from "./constants";
import { Info } from "lucide-react";

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

  const canShorten = useMemo(() => {
    return url.length > 0 && activeAccount && ((useCustomShortcode && customShortcode.length > 0) || !useCustomShortcode);
  }, [url, activeAccount, useCustomShortcode, customShortcode]);

  const appClient = useMemo(() => {
    const algorand = APP_CONFIG.client;
    const olinkFactory = new OLinkFactory({
      algorand: algorand,
    });

    const appClient = olinkFactory.getAppClientById({
      appId: APP_CONFIG.appId,
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
      if (checkingLocation) return;
      setCheckingLocation(true);
      const location = window.location.href;
      const shortcode = extractShortcodeFromUrl(location);
      console.log("Location shortcode:", shortcode);
      if (shortcode) {
        try {
          const resolvedUrl = await appClient.resolveShortcode({
            args: [shortcode],
            sender: "ERXD6RUWJ5YKZEXGLSE3N3MRJPVL3AWKX6VUMFJRE7W4EGA5HQR5LXBE4E",
          });
          setLocationUrl(resolvedUrl);
          console.log("Location URL:", resolvedUrl);
        } catch (error) {
          console.error("Invalid shortcode:", error);
        }
      } else {
        setLocationUrl(undefined);
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
    if (!appClient) return;

    try {
      const result = await appClient.resolveShortcode({
        args: [shortcode],
        sender: "ERXD6RUWJ5YKZEXGLSE3N3MRJPVL3AWKX6VUMFJRE7W4EGA5HQR5LXBE4E",
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

      // + 4 is for the two-byte headers for the shortcode and the URL
      const mbrAmount = 2500 + 400 * (url.length + 8 + 4);

      const mbrPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAccount.address,
        to: algosdk.getApplicationAddress(APP_CONFIG.appId),
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

      // + 4 is for the two-byte headers for the shortcode and the URL
      const mbrAmount = 2500 + 400 * (url.length + customShortCode.length + 4);

      const mbrPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAccount.address,
        to: algosdk.getApplicationAddress(APP_CONFIG.appId),
        amount: mbrAmount,
        suggestedParams,
      });

      const oraAsaId = await appClient.state.global.oraAsaId();
      const customLinkPrice = await appClient.state.global.customLinkPrice();

      console.log("oraAsaId", oraAsaId, "customLinkPrice", customLinkPrice);

      if (!oraAsaId || !customLinkPrice) return;

      const oraPayment = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: activeAccount.address,
        to: algosdk.getApplicationAddress(APP_CONFIG.appId),
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
            <div className="flex w-full relative rounded-t-xl bg-orange-500 text-orange-100 items-center">
              <div className="size-4 pl-2" />
              <div className="text-base grow p-1 text-center">ORANGE LINK</div>
              <button className="pr-2">
                <Tooltip.Provider>
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <button className="flex items-center cursor-pointer">
                        <Info className="size-4" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="w-64 flex flex-col gap-2 select-none rounded bg-white p-4 drop-shadow-sm text-sm ">
                        <p>Orange Link is a decentralized, open-source link shortener built on Algorand.</p>
                        <p>
                          Learn more{" "}
                          <a href="https://github.com/bitshiftmod/ora-link" target="_blank" rel="noopener noreferrer" className="underline">
                            here
                          </a>
                        </p>

                        <Tooltip.Arrow className="fill-white" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </button>
            </div>

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
                disabled={shortcode.length === 0}
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
                text={activeAccount == null ? "Connect Wallet" : "Shorten"}
                disabled={!canShorten}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
