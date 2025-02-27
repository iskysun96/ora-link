import { AlgorandClient, getTransactionParams, sendTransaction } from '@algorandfoundation/algokit-utils';
import { Account, Algodv2, makeAssetTransferTxnWithSuggestedParamsFromObject, TransactionSigner } from 'algosdk';

const TOKEN_SUPPLY = 4000000_00000000;
const TOKEN_DECIMALS = 8;

export const optInAsset = async (from: Account, assetId: number, algod: Algodv2) => {
  // opt-in txn for user for the asset
  const optInTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: from.addr,
    to: from.addr,
    amount: 0,
    assetIndex: assetId,
    suggestedParams: await getTransactionParams(undefined, algod),
  });

  await sendTransaction({ transaction: optInTxn, from }, algod);
};

export const createTestAsset = async (from: Account, algod: AlgorandClient, signer: TransactionSigner) => {
  console.log('Creating asset...');
  const res = await algod.send.assetCreate({
    sender: from.addr,
    manager: from.addr,
    assetName: 'Test Asset',
    unitName: 'TEST',
    decimals: TOKEN_DECIMALS,
    total: BigInt(TOKEN_SUPPLY),
    defaultFrozen: false,
    signer,
  });

  const { confirmation } = res;

  const assetId = confirmation?.assetIndex;

  if (assetId === undefined) {
    throw new Error('failed to create asset');
  }

  return assetId;
};
