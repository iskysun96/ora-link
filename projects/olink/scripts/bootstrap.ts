import { algo, microAlgo } from '@algorandfoundation/algokit-utils';
import { appClient, creator, APP_CONFIG } from './constants';

const main = async () => {
  const assetId = APP_CONFIG.oraAssetID;

  await appClient.appClient.fundAppAccount({ amount: algo(0.2), sender: creator.addr });
  await appClient.send.bootstrap({
    args: { oraAsaId: assetId, customLinkPrice: 100000000 },
    sender: creator.addr,
    assetReferences: [assetId],
    extraFee: microAlgo(1000),
  });
};

main();
