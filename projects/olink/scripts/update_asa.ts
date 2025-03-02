import { microAlgo } from '@algorandfoundation/algokit-utils';
import { appClient, creator, APP_CONFIG } from './constants';

const main = async () => {
  await appClient.send.updateCustomLinkCost({
    args: { asaId: APP_CONFIG.oraAssetID, newCost: 100000000 },
    sender: creator.addr,
    assetReferences: [APP_CONFIG.oraAssetID],
    extraFee: microAlgo(1000),
  });
};

main();
