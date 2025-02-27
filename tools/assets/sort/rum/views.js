import AbstractRumSort from './abstractrumsort.js';
import SortRegistry from '../sortregistry.js';

class Views extends AbstractRumSort {
  static get key() {
    return 'pageViews';
  }

  static get description() {
    return 'Page Views';
  }

  // eslint-disable-next-line class-methods-use-this
  get rumProperty() {
    return 'pageViews';
  }
}

export default Views;

SortRegistry.registerSort(Views);
