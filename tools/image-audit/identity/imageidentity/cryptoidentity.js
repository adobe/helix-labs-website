/* eslint-disable class-methods-use-this */
import AbstractIdentity from '../abstractidentity.js';
import IdentityRegistry from '../identityregistry.js';
import SizeIdentity from './sizeidentity.js';
import Hash from '../util/hash.js';

class CryptoIdentity extends AbstractIdentity {
  #id;

  constructor(identityId) {
    super();
    this.#id = identityId;
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

  get id() {
    return this.#id;
  }

  get strong() {
    return true;
  }

  get signleton() {
    return false;
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

    // Get image data (raw pixels) directly from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const hash = `cryi:${await Hash.createHash(imageData.data.buffer)}`;
    const identity = new CryptoIdentity(hash);
    clusterManager.get(originatingClusterId).addIdentity(identity);
  }
}

IdentityRegistry.register(CryptoIdentity);
