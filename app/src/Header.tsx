import { useWallet, Wallet } from "@txnlab/use-wallet-react";
import Button from "./components/Button";
import { Dialog, Popover } from "radix-ui";
import { useState } from "react";

const WalletOption = ({ wallet }: { wallet: Wallet }) => {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await wallet.connect();
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <button onClick={handleConnect} disabled={connecting} className="flex gap-2 items-center cursor-pointer">
      <img src={wallet.metadata.icon} alt={wallet.metadata.name} className="size-8" />
      <span>{wallet.metadata.name}</span>
    </button>
  );
};

const Header = () => {
  const { wallets, activeAccount, activeWallet } = useWallet();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 flex flex-row ">
      <div className="grow"></div>

      {activeAccount ? (
        <Popover.Root>
          <Popover.Trigger asChild>
            <button className="text-orange-100  p-2 text-sm rounded bg-orange-500">{`${activeAccount.address.slice(
              0,
              4
            )}...${activeAccount.address.slice(-4)}`}</button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="w-[260px] rounded bg-orange-100 p-5 shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] will-change-[transform,opacity] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.violet7)] data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=top]:animate-slideDownAndFade"
              sideOffset={5}
            >
              <button
                className="w-full p-2 text-sm rounded bg-orange-500 text-orange-100"
                onClick={() => {
                  activeWallet?.disconnect();
                }}
              >
                Disconnect
              </button>
              {/* <Popover.Close
                className="absolute right-[5px] top-[5px] inline-flex size-[25px] cursor-default items-center justify-center rounded-full text-violet11 outline-none hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7"
                aria-label="Close"
              >
                <Cross2Icon />
              </Popover.Close> */}
              <Popover.Arrow className="fill-white" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ) : (
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button onClick={() => {}} text="Connect" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-orange-100 p-6 shadow-lg flex flex-col gap-4 min-w-48">
              <Dialog.Title className="text-center font-extrabold">Connect</Dialog.Title>
              {wallets.map((wallet) => (
                <WalletOption key={wallet.id} wallet={wallet} />
              ))}
              {/* <Dialog.Close /> */}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
};

export default Header;
