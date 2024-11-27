import AbstractFilter from './abstractfilter.js';
import UrlAndPageIdentity from '../identity/imageidentity/urlandpageidentity.js';
import FilterRegistry from './filterregistry.js';

class MissingAltText extends AbstractFilter {
  static isActive(sitemapFormData, identifiers) {
    return identifiers.has(UrlAndPageIdentity.type);
  }

  static get key() {
    return 'noalt';
  }

  static get description() {
    return 'Missing Alt Text';
  }

  // eslint-disable-next-line no-unused-vars
  static include(cluster, filterKeys) {
    const altText = cluster.getAll(UrlAndPageIdentity.type, 'alt');
    const sites = cluster.getAll(UrlAndPageIdentity.type, 'site');

    return this.#validateAlt(altText, sites.length);
  }

  static #validateAlt(alt, count) {
    if (alt.length === 0 || alt.length !== count) return false;
    if (alt.some((item) => item === '')) return false;
    return true;
  }
}

FilterRegistry.register(MissingAltText);

export default MissingAltText;
