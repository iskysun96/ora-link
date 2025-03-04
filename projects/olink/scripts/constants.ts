import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { OLinkFactory } from '../contracts/clients/OLinkClient';

const { DEPLOYER_MNEMONIC } = process.env;

// const APP_ID = 0;

const TESTNET_APP_CONFIG = {
  appId: 734703029,
  oraAssetID: BigInt(734611834),
  client: AlgorandClient.testNet(),
};

const MAINNET_APP_CONFIG = {
  appId: 2811675048,
  oraAssetID: BigInt(1284444444),
  client: AlgorandClient.mainNet(),
};

const TARGET_NETWORK = process.env.TARGET_NETWORK ?? 'testnet';

export const APP_CONFIG = TARGET_NETWORK === 'testnet' ? TESTNET_APP_CONFIG : MAINNET_APP_CONFIG;

const algorand = APP_CONFIG.client;
export const creator = algosdk.mnemonicToSecretKey(DEPLOYER_MNEMONIC as string);

algorand.setSignerFromAccount(creator);
console.log(`Deploying as ${creator.addr}`);

export const factory = algorand.client.getTypedAppFactory(OLinkFactory);
export const appClient = factory.getAppClientById({ appId: BigInt(APP_CONFIG.appId) });
