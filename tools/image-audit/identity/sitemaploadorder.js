/* eslint-disable class-methods-use-this */
import AbstractIdentity from './abstractidentity.js';

class SitemapLoadOrderIdentity extends AbstractIdentity {
  #id;

  constructor(loadOrder) {
    super();
    this.#id = `sloi:${loadOrder}`;
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

  get id() {
    return this.#id;
  }

  get strong() {
    // There would never be a collision so it would never be merged.
    return true;
  }

  get signleton() {
    return false;
  }
}

export default SitemapLoadOrderIdentity;

// created manually, not autowired.
