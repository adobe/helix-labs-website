import AbstractRumSort from './abstractrumsort.js';
import SortRegistry from '../sortregistry.js';

class Bounces extends AbstractRumSort {
  static get key() {
    return 'bounces';
  }

  static get description() {
    return 'Bounces';
  }

  // eslint-disable-next-line class-methods-use-this
  get rumProperty() {
    return 'bounces';
  }
}

export default Bounces;

SortRegistry.registerSort(Bounces);
