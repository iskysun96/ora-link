import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { algo, Config, microAlgo, AlgorandClient } from '@algorandfoundation/algokit-utils';
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account';
import { OLinkClient, OLinkFactory } from '../contracts/clients/OLinkClient';
import { createTestAsset } from './utils';

// Configure this once, outside of any test hooks
Config.configure({ populateAppCallResources: true });

// Create the fixture outside of any hooks
const fixture = algorandFixture({ testAccountFunding: algo(1000) });
let appClient: OLinkClient;
let assetId: number | bigint;
// Store these at the top level so they can be accessed by all tests
let testAccount: TransactionSignerAccount;
let algorand: AlgorandClient;

describe('OLink', () => {
  // Initialize the fixture once before all tests
  beforeAll(async () => {
    // Initialize the fixture
    await fixture.beforeEach();

    // Store these values at the top level
    testAccount = fixture.context.testAccount;
    algorand = fixture.algorand;

    const factory = new OLinkFactory({
      algorand,
      defaultSender: testAccount.addr,
    });

    const createResult = await factory.send.create.createApplication({ args: [] });
    appClient = createResult.appClient;
    await appClient.appClient.fundAppAccount({ amount: algo(0.2) });

    assetId = await createTestAsset(testAccount, algorand);

    await appClient.send.bootstrap({
      args: { oraAsaId: assetId, customLinkPrice: 10000000 },
      sender: testAccount.addr,
      extraFee: microAlgo(1000),
      assetReferences: [BigInt(assetId)],
    });
  });

  // Reset the fixture state before each test
  beforeEach(fixture.beforeEach);

  test('createShortcode', async () => {
    const url = 'https://algorand.co';
    const mbrAmount = 2500 + 400 * (url.length + 8 + 4);

    const mbrPayment = await algorand.createTransaction.payment({
      sender: testAccount.addr,
      receiver: appClient.appAddress,
      amount: microAlgo(mbrAmount),
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
    const url = 'https://testforwithdraw.url';
    const shortcode = 'testforwithdraw';
    const mbrAmount = 2500 + 400 * (url.length + shortcode.length + 4);

    const oraPayment = await algorand.createTransaction.assetTransfer({
      sender: testAccount.addr,
      receiver: appClient.appAddress,
      assetId: BigInt(assetId),
      amount: BigInt(10000000),
    });

    const mbrPayment = await algorand.createTransaction.payment({
      sender: testAccount.addr,
      receiver: appClient.appAddress,
      amount: microAlgo(mbrAmount),
    });

    console.log('testing1', oraPayment);

    const shortCode = await appClient.send.createCustomShortcode({
      args: { mbrPayment, oraPayment, shortcode, url },
      sender: testAccount.addr,
      signer: testAccount.signer,
      populateAppCallResources: true,
    });

    console.log('testing', shortCode.return);

    expect(shortCode.return).toBe(shortcode);

    await appClient.send.withdraw({
      args: [],
      sender: testAccount.addr,
      populateAppCallResources: true,
      assetReferences: [BigInt(assetId)],
      extraFee: microAlgo(1000),
    });

    // Check app address asset balance
    const appAccountAssetInfo = await algorand.asset.getAccountInformation(appClient.appAddress, BigInt(assetId));
    expect(appAccountAssetInfo.balance).toBe(BigInt(0));

    // Check test account asset balance
    const testAccountAssetInfo = await algorand.asset.getAccountInformation(testAccount.addr, BigInt(assetId));
    expect(testAccountAssetInfo.balance).toBe(BigInt(400000000000000));
  });
});
