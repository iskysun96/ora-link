import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { OLinkFactory } from '../contracts/clients/OLinkClient';

const { DEPLOYER_MNEMONIC } = process.env;

// const APP_ID = 0;
export const APP_ID = 734703029;
export const ORA_ASSET_ID = BigInt(734611834);

const algorand = AlgorandClient.testNet();
export const creator = algosdk.mnemonicToSecretKey(DEPLOYER_MNEMONIC as string);

algorand.setSignerFromAccount(creator);
console.log(`Deploying as ${creator.addr}`);

export const factory = algorand.client.getTypedAppFactory(OLinkFactory);
export const appClient = factory.getAppClientById({ appId: BigInt(APP_ID) });
