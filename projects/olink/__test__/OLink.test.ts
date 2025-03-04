import { describe, test, expect, beforeAll } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { algo, Config, microAlgo } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { OLinkClient, OLinkFactory } from '../contracts/clients/OLinkClient';
import { createTestAsset } from './utils';

const fixture = algorandFixture({ testAccountFunding: algo(1000) });
Config.configure({ populateAppCallResources: true });

let appClient: OLinkClient;
let assetId: number | bigint;

describe('OLink', () => {
  // beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();

    const { testAccount } = fixture.context;
    const { algorand } = fixture;

    const factory = new OLinkFactory({
      algorand,
      defaultSender: testAccount.addr,
    });

    const createResult = await factory.send.create.createApplication({ args: [] });
    appClient = createResult.appClient;
    await appClient.appClient.fundAppAccount({ amount: algo(0.2) });

    assetId = await createTestAsset(testAccount, algorand, testAccount.signer);

    await appClient.send.bootstrap({
      args: { oraAsaId: assetId, customLinkPrice: 10000000 },
      sender: testAccount.addr,
      extraFee: microAlgo(1000),
      assetReferences: [BigInt(assetId)],
    });
  });

  test('createShortcode', async () => {
    const { testAccount, algod } = fixture.context;
    const url = 'https://algorand.co';
    const mbrAmount = 2500 + 400 * (url.length + 8 + 4);

    const mbrPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: testAccount.addr,
      to: appClient.appAddress,
      amount: mbrAmount,
      suggestedParams: await algod.getTransactionParams().do(),
    });

    const shortCode = await appClient.send.createShortcode({
      args: { mbrPayment, url },
      sender: testAccount.addr,
      signer: testAccount.signer,
      populateAppCallResources: true,
    });

    expect(shortCode.return).toBe('80LQLO0I');

    const foundShortCode = await appClient.send.findShortcode({ args: { url } });
    expect(foundShortCode.return).toBe(shortCode.return);

    const resolvedUrl = await appClient.send.resolveShortcode({ args: { shortcode: shortCode.return! } });
    expect(resolvedUrl.return).toBe(url);

    expect(async () => {
      await appClient.send.resolveShortcode({ args: { shortcode: 'abc' } });
    }).rejects.toThrowError();

    const resolvedUrl2 = await appClient.send.resolveShortcode({ args: { shortcode: shortCode.return! } });
    expect(resolvedUrl2.return).toBe(url);
  });

  test('withdraw', async () => {
    const { testAccount, algod } = fixture.context;
    const url = 'https://testforwithdraw.url';
    const shortcode = 'testforwithdraw';
    const mbrAmount = 2500 + 400 * (url.length + shortcode.length + 4);

    const oraPayment = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: testAccount.addr,
      to: appClient.appAddress,
      assetIndex: Number(assetId),
      amount: 10000000,
      suggestedParams: await algod.getTransactionParams().do(),
    });

    const mbrPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: testAccount.addr,
      to: appClient.appAddress,
      amount: mbrAmount,
      suggestedParams: await algod.getTransactionParams().do(),
    });

    const shortCode = await appClient.send.createCustomShortcode({
      args: { oraPayment, mbrPayment, shortcode, url },
      sender: testAccount.addr,
      signer: testAccount.signer,
      populateAppCallResources: true,
    });

    expect(shortCode.return).toBe(shortcode);

    await appClient.send.withdraw({
      args: [],
      sender: testAccount.addr,
      populateAppCallResources: true,
      assetReferences: [BigInt(assetId)],
      extraFee: microAlgo(1000),
    });

    // Check app address asset balance
    const appAccountAssetInfo = await algod.accountAssetInformation(appClient.appAddress, Number(assetId)).do();
    expect(appAccountAssetInfo['asset-holding'].amount).toBe(0);

    // Check test account asset balance
    const testAccountAssetInfo = await algod.accountAssetInformation(testAccount.addr, Number(assetId)).do();
    expect(testAccountAssetInfo['asset-holding'].amount).toBe(400000000000000);
  });
});
