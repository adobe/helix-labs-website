import AbstractRumSort from './abstractrumsort.js';
import SortRegistry from '../sortregistry.js';

class Visits extends AbstractRumSort {
  static get key() {
    return 'visits';
  }

  static get description() {
    return 'Visits';
  }

  // eslint-disable-next-line class-methods-use-this
  get rumProperty() {
    return 'visits';
  }
}

export default Visits;

SortRegistry.registerSort(Visits);
