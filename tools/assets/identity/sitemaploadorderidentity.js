/* eslint-disable class-methods-use-this */
import AbstractIdentity from './abstractidentity.js';

class SitemapLoadOrderIdentity extends AbstractIdentity {
  constructor(loadOrder) {
    super(`sloi:${loadOrder}`);
  }

  static get type() {
    return 'sitemap-load-order-identity';
  }

  static get uiSelectorProperties() {
    return {
      identity: SitemapLoadOrderIdentity.type,
      display: 'Sitemap Load Order',
      checked: true,
      hidden: true,
    };
  }

  get strong() {
    // There would never be a collision so it would never be merged.
    return true;
  }

  // Strong identities should never merge - if this is called, it's a bug
  // eslint-disable-next-line no-unused-vars
  mergeOther(otherIdentity) {
    throw new Error('BUG: mergeOther called on strong identity SitemapLoadOrderIdentity');
  }
}

export default SitemapLoadOrderIdentity;

// created manually, not autowired.
