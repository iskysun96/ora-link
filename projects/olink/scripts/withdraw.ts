import { microAlgo } from '@algorandfoundation/algokit-utils';
import { appClient, creator, APP_CONFIG } from './constants';

appClient.send.withdraw({
  args: [],
  sender: creator.addr,
  assetReferences: [APP_CONFIG.oraAssetID],
  populateAppCallResources: true,
  extraFee: microAlgo(1000),
});
