import { algo, microAlgo } from '@algorandfoundation/algokit-utils';
import { appClient, creator } from './constants';

const main = async () => {
  const assetId = BigInt(734611834);

  await appClient.appClient.fundAppAccount({ amount: algo(2), sender: creator.addr });
  await appClient.send.bootstrap({
    args: { oraAsaId: assetId, customLinkPrice: 100000000 },
    sender: creator.addr,
    assetReferences: [assetId],
    extraFee: microAlgo(1000),
  });
};

main();
