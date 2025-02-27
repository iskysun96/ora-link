import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { algo, Config, microAlgo } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { OLinkClient, OLinkFactory } from '../contracts/clients/OLinkClient';
import { createTestAsset } from './utils';

const fixture = algorandFixture({ testAccountFunding: algo(100) });
Config.configure({ populateAppCallResources: true });

let appClient: OLinkClient;

describe('OLink', () => {
  beforeEach(fixture.beforeEach);

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
    await appClient.appClient.fundAppAccount({ amount: algo(1) });

    const assetId = await createTestAsset(testAccount, algorand, testAccount.signer);

    await appClient.send.bootstrap({
      args: { oraAsaId: assetId, customLinkPrice: 10000000 },
      sender: testAccount.addr,
      extraFee: microAlgo(1000),
      assetReferences: [BigInt(assetId)],
    });
  });

  // TODO: test invalid MBR amount, url length, already created
  test('createShortcode', async () => {
    const { testAccount, algod } = fixture.context;
    const url = 'https://algorand.co';
    const mbrAmount = 2500 + 400 * (url.length + 8);

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
});
