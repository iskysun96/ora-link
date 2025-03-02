import { AlgorandClient } from "@algorandfoundation/algokit-utils";

const TARGET_NETWORK = process.env.TARGET_NETWORK ?? 'testnet';

const TESNET_CONFIG = {
  appId: BigInt(734703029),
  oraAssetID: BigInt(734611834),
  client: AlgorandClient.testNet(),
};

const MAINNET_CONFIG = {
  // TODO: replace with real mainnet app id
  appId: BigInt(0),
  oraAssetID: BigInt(1284444444),
  client: AlgorandClient.mainNet(),
};

export const APP_CONFIG = TARGET_NETWORK === 'testnet' ? TESNET_CONFIG : MAINNET_CONFIG;
