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

// const TOKEN_SUPPLY = 4000000_00000000;
// const TOKEN_DECIMALS = 8;

const main = async () => {
  const assetId = BigInt(734611834);

  // const res = await algorand.send.assetCreate({
  //   total: BigInt(TOKEN_SUPPLY),
  //   decimals: TOKEN_DECIMALS,
  //   assetName: 'OLink Test',
  //   unitName: 'OLinkTst',
  //   // url: 'https://orangelink.xyz',
  //   sender: creator.addr,
  // });

  // console.log('Asset created:', res.assetId);

  const appClient = factory.getAppClientById({ appId: BigInt(APP_ID) });
  await appClient.appClient.fundAppAccount({ amount: algo(2), sender: creator.addr });
  await appClient.send.bootstrap({
    args: { oraAsaId: assetId, customLinkPrice: 100000000 },
    sender: creator.addr,
    assetReferences: [assetId],
    extraFee: microAlgo(1000),
  });
};

main();
