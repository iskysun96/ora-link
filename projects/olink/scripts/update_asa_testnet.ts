import { microAlgo } from '@algorandfoundation/algokit-utils';
import { appClient, creator, ORA_ASSET_ID } from './constants';

const main = async () => {
  await appClient.send.updateCustomLinkCost({
    args: { asaId: ORA_ASSET_ID, newCost: 100000000 },
    sender: creator.addr,
    assetReferences: [ORA_ASSET_ID],
    extraFee: microAlgo(1000),
  });
};

main();
