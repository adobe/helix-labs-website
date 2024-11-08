/* eslint-disable class-methods-use-this */
import AbstractIdentity from '../abstractidentity.js';
import IdentityRegistry from '../identityregistry.js';
import SizeIdentity from './sizeidentity.js';
import Hash from '../util/hash.js';

class CryptoIdentity extends AbstractIdentity {
  constructor(identityId) {
    super(identityId);
  }

  static get type() {
    return 'crypto-img-identity';
  }

  static get uiSelectorProperties() {
    return {
      identity: CryptoIdentity.type,
      display: 'Cryptographic',
      checked: true,
      hidden: false,
    };
  }

  get strong() {
    return true;
  }

  // eslint-disable-next-line no-unused-vars
  static async identifyPostflightWithCanvas(identityValues, identityState) {
    const {
      originatingClusterId,
      clusterManager,
      canvas,
      ctx,
    } = identityValues;

    const { href } = identityValues.entryValues;

    const sizeIdentifier = clusterManager.get(originatingClusterId)
      .get(await SizeIdentity.getSizeId(href));
    if (sizeIdentifier?.tooBigForWeb) {
      // don't bother with large images.
      return;
    }

    const hash = await identityValues.get(CryptoIdentity, 'hash', () => CryptoIdentity.#getHash(canvas, ctx));
    const identity = new CryptoIdentity(hash);
    clusterManager.get(originatingClusterId).addIdentity(identity);
  }

  static async #getHash(canvas, ctx) {
    // Get image data (raw pixels) directly from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return `cryi:${await Hash.createHash(imageData.data.buffer)}`;
  }
}

IdentityRegistry.register(CryptoIdentity);
