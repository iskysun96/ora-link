import { algo, AlgorandClient, microAlgo } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { OLinkFactory } from '../contracts/clients/OLinkClient';

const { DEPLOYER_MNEMONIC } = process.env;

// const APP_ID = 0;
const APP_ID = 734703029;

const algorand = AlgorandClient.testNet();
const creator = algosdk.mnemonicToSecretKey(DEPLOYER_MNEMONIC as string);
algorand.setSignerFromAccount(creator);

console.log(`Deploying as ${creator.addr}`);

const factory = algorand.client.getTypedAppFactory(OLinkFactory, {
  // deletable: true,
  // updatable: true,
});

const main = async () => {
  const assetId = BigInt(734611834);

  const appClient = factory.getAppClientById({ appId: BigInt(APP_ID) });
  await appClient.send.updateCustomLinkCost({
    args: { asaId: assetId, newCost: 100000000 },
    sender: creator.addr,
    assetReferences: [assetId],
    extraFee: microAlgo(1000),
  });
};

main();
