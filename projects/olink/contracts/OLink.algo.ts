import { Contract } from '@algorandfoundation/tealscript';

export class OLink extends Contract {
  manager = GlobalStateKey<Address>({ key: 'manager' });

  oraAsaId = GlobalStateKey<AssetID>({ key: 'oraAsaId' });

  customLinkPrice = GlobalStateKey<uint64>({ key: 'linkPrice' });

  linkMap = BoxMap<string, string>();

  @allow.bareCreate()
  createApplication(): void {
    this.manager.value = globals.creatorAddress;
  }

  bootstrap(oraAsaId: AssetID, customLinkPrice: uint64): void {
    assert(this.oraAsaId.value === AssetID.zeroIndex, 'Already bootstrapped');
    assert(oraAsaId !== AssetID.zeroIndex, 'ASA must be non-zero');
    verifyAppCallTxn(this.txn, { sender: this.manager.value });

    this.oraAsaId.value = oraAsaId;
    this.customLinkPrice.value = customLinkPrice;

    // opt contract into ASA
    sendAssetTransfer({
      assetReceiver: this.app.address,
      assetAmount: 0,
      xferAsset: oraAsaId,
    });
  }

  updateCustomLinkCost(asaId: AssetID, newCost: uint64): void {
    verifyAppCallTxn(this.txn, { sender: this.manager.value });
    assert(asaId.id > 0, 'ASA ID must be non-zero');
    assert(newCost > 0, 'New cost must be non-zero');

    this.oraAsaId.value = asaId;
    this.customLinkPrice.value = newCost;

    // opt contract into ASA
    sendAssetTransfer({
      assetReceiver: this.app.address,
      assetAmount: 0,
      xferAsset: asaId,
    });
  }

  @allow.bareCall('UpdateApplication')
  updateApplication(): void {
    verifyAppCallTxn(this.txn, { sender: this.manager.value });
  }

  @allow.bareCall('DeleteApplication')
  deleteApplication(): void {
    verifyAppCallTxn(this.txn, { sender: this.manager.value });
  }

  @abi.readonly
  resolveShortcode(shortcode: string): string {
    assert(this.linkMap(shortcode).exists, 'Shortcode does not exist');
    return this.linkMap(shortcode).value;
  }

  @abi.readonly
  findShortcode(url: string): string {
    const hash = sha256(url);

    for (let i = 0; i < 24; i += 1) {
      const shortcode = this.generateShortcode(hash, i);
      if (this.linkMap(shortcode).exists) {
        if (this.linkMap(shortcode).value === url) {
          return shortcode;
        }
      } else {
        assert(false, 'Shortcode does not exist');
      }
    }
    return '';
  }

  private generateShortcode(hash: StaticBytes<32>, startIndex: uint64): string {
    const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let shortcode = '';

    for (let i = startIndex; i < startIndex + 8; i += 1) {
      const num = getbyte(hash, i) % charset.length;
      shortcode += charset[num];
    }
    return shortcode;
  }

  /** Called to generate a shortcode for a URL. */
  createShortcode(mbrPayment: PayTxn, url: string): string {
    const mbrPaymentAmount = 2500 + 400 * (url.length + 8);

    assert(mbrPayment.receiver === this.app.address, 'MBR Payment not sent to app address');
    assert(mbrPayment.amount === mbrPaymentAmount, 'Incorrect payment amount');

    const hash = sha256(url);

    for (let i = 0; i < 24; i += 1) {
      const shortcode = this.generateShortcode(hash, i);
      if (this.linkMap(shortcode).exists) {
        if (this.linkMap(shortcode).value === url) {
          const errorMessage = 'Shortcode already exists: ' + shortcode;
          assert(false, errorMessage);
        }
      } else {
        this.linkMap(shortcode).value = url;
        return shortcode;
      }
    }

    assert(false, 'Failed to create shortcode');
    return '';
  }

  /** Called to generate a shortcode for a URL. */
  createCustomShortcode(mbrPayment: PayTxn, oraPayment: AssetTransferTxn, shortcode: string, url: string): string {
    assert(!this.linkMap(shortcode).exists, 'Shortcode already exists');

    const mbrPaymentAmount = 2500 + 400 * (url.length + shortcode.length);

    verifyPayTxn(mbrPayment, { receiver: this.app.address, amount: mbrPaymentAmount });
    verifyAssetTransferTxn(oraPayment, {
      assetReceiver: this.app.address,
      assetAmount: this.customLinkPrice.value,
      xferAsset: this.oraAsaId.value,
    });

    this.linkMap(shortcode).value = url;
    return shortcode;
  }

  withdraw(): void {
    verifyAppCallTxn(this.txn, { sender: this.manager.value });

    const contractBalance = this.app.address.assetBalance(this.oraAsaId.value);

    assert(contractBalance > 0, 'No balance to withdraw');

    sendAssetTransfer({
      sender: this.app.address,
      assetReceiver: this.txn.sender,
      assetAmount: contractBalance,
      xferAsset: this.oraAsaId.value,
    });
  }
}
