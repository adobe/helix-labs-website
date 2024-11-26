import AbstractRumSort from './abstractrumsort.js';
import SortRegistry from '../sortregistry.js';

class Conversions extends AbstractRumSort {
  static get key() {
    return 'conversions';
  }

  static get description() {
    return 'Page Conversions';
  }

  // eslint-disable-next-line class-methods-use-this
  get rumProperty() {
    return 'conversions';
  }
}

export default Conversions;

SortRegistry.registerSort(Conversions);
