import { microAlgo } from '@algorandfoundation/algokit-utils';
import { appClient, creator, ORA_ASSET_ID } from './constants';

appClient.send.withdraw({
  args: [],
  sender: creator.addr,
  assetReferences: [ORA_ASSET_ID],
  populateAppCallResources: true,
  extraFee: microAlgo(1000),
});
