import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { AlgoConfig } from '@algorandfoundation/algokit-utils/types/network-client';
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account';
import { Account } from 'algosdk';

const TOKEN_SUPPLY = 4000000_00000000;
const TOKEN_DECIMALS = 8;

export const optInAsset = async (algorandClient: AlgorandClient, from: Account, assetId: bigint) => {
  // opt-in txn for user for the asset
  await algorandClient.send.assetOptIn({
    sender: from.addr,
    assetId,
  });
};

export const getAlgorandClient = async (config: AlgoConfig): Promise<AlgorandClient> => {
  return AlgorandClient.fromConfig(config);
};

export const createTestAsset = async (from: TransactionSignerAccount, algorandClient: AlgorandClient) => {
  console.log('Creating asset...');
  const res = await algorandClient.send.assetCreate({
    sender: from.addr,
    manager: from.addr,
    assetName: 'Test Asset',
    unitName: 'TEST',
    decimals: TOKEN_DECIMALS,
    total: BigInt(TOKEN_SUPPLY),
    defaultFrozen: false,
  });

  const assetId = res?.assetId;

  if (assetId === undefined) {
    throw new Error('failed to create asset');
  }

  return assetId;
};
