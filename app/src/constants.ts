import { AlgorandClient } from "@algorandfoundation/algokit-utils";

export const TARGET_NETWORK = import.meta.env.VITE_TARGET_NETWORK ?? 'testnet';

const TESTNET_CONFIG = {
  appId: BigInt(734703029),
  oraAssetID: BigInt(734611834),
  client: AlgorandClient.testNet(),
};

const MAINNET_CONFIG = {
  appId: BigInt(2811675048),
  oraAssetID: BigInt(1284444444),
  client: AlgorandClient.mainNet(),
};

export const APP_CONFIG = TARGET_NETWORK === 'testnet' ? TESTNET_CONFIG : MAINNET_CONFIG;
