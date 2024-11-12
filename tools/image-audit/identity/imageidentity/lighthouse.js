/* eslint-disable class-methods-use-this */
import AbstractIdentity from '../abstractidentity.js';
import IdentityRegistry from '../identityregistry.js';
import ColorIdentity from './coloridentity.js';
import SizeIdentity from './sizeidentity.js';
import UrlAndPageIdentity from './urlandpageidentity.js';
import TextIdentity from './textidentity.js';

class Lighthouse extends AbstractIdentity {
  #identityValues;

  #identityState;

  get #minRumValue() { return 100; } // use > this to get at least 2x score

  get #maxTopColors() { return 4; }

  constructor(identityValues, identityState) {
    super('lh');
    this.#identityValues = identityValues;
    this.#identityState = identityState;
  }

  static get type() {
    return 'lighthouse';
  }

  static get uiSelectorProperties() {
    return {
      identity: Lighthouse.type,
      display: 'Lighthouse',
      checked: true,
      hidden: true,
    };
  }

  // eslint-disable-next-line no-unused-vars
  static async identifyPreflight(identityValues, identityState) {
    const {
      originatingClusterId,
      clusterManager,
    } = identityValues;

    const identity = new Lighthouse(identityValues, identityState);
    clusterManager.get(originatingClusterId).addIdentity(identity);
  }

  get #maxViews() {
    // TODO: this wont work if someone clicks before the loading is complete.
    if (!this.#identityState.maxViews) {
      this.#identityState.maxViews = 0;
      this.#identityValues.clusterManager.getAllClusters().forEach((cluster) => {
        cluster.getAllIdentitiesOf(UrlAndPageIdentity.type).forEach((identity) => {
          if (identity.pageViews > this.#identityState.maxViews) {
            this.#identityState.maxViews = identity.pageViews;
          }
        });
      });
    }

    return this.#identityState.maxViews;
  }

  get #onBrandColors() {
    if (!this.#identityState.topColors) {
      const colorsToCount = new Map();
      this.#identityState.maxViews = 0;

      // Gather all colors and their counts
      this.#identityValues.clusterManager.getAllClusters().forEach((cluster) => {
        cluster.getSingletonOf(ColorIdentity.type).topColors.forEach((color) => {
          colorsToCount.set(color, (colorsToCount.get(color) || 0) + 1);
        });
      });

      // Convert the map to an array of [color, count] pairs
      const colorsArray = Array.from(colorsToCount.entries());

      // Sort the array by count in descending order
      colorsArray.sort((a, b) => b[1] - a[1]);

      // Initialize a set to hold the top colors
      const topColors = new Set();
      const countLimit = this.#maxTopColors;
      let lastCount = colorsArray[0][1]; // The count of the first color

      // Iterate over the sorted colors array to pick top colors, handling ties
      for (let i = 0; i < colorsArray.length; i += 1) {
        const color = colorsArray[i][0];
        const count = colorsArray[i][1];

        // If we've already reached the count limit, stop if it's not a tie
        if (topColors.size >= countLimit && count !== lastCount) {
          break;
        }

        // Add the color to the top colors, if we haven't reached the limit yet
        if (topColors.size < countLimit) {
          topColors.add(color);
        }

        // Update the last count for tie checking
        lastCount = count;
      }

      // Store the result in this.#identityState.topColors
      this.#identityState.topColors = topColors;
    }

    return this.#identityState.topColors;
  }

  get #maxConversions() {
    // TODO: this wont work if someone clicks before the loading is complete.
    if (!this.#identityState.maxConversions) {
      this.#identityState.maxConversions = 0;
      this.#identityValues.clusterManager.getAllClusters().forEach((cluster) => {
        cluster.getAllIdentitiesOf(UrlAndPageIdentity.type).forEach((identity) => {
          if (identity.conversions > this.#identityState.maxConversions) {
            this.#identityState.maxConversions = identity.conversions;
          }
        });
      });
    }

    return this.#identityState.maxViews;
  }

  get scores() {
    return {
      usageScores: this.usageScore,
      accessiblityScore: this.accessibilityScore,
      onBrandScore: this.onBrandScore,
      bestWebPractices: this.bestWebPracticesScore,
      get total() {
        return (
          this.usageScores.total
        + this.accessiblityScore.total
        + this.onBrandScore.total
        + this.bestWebPractices.total
        ) / 4;
      },
    };
  }

  get usageScore() {
    const rv = {
      highViewRate: 0,
      hasViews: 0,
      highConversionRate: 0,
      hasConversions: 0,
      get total() {
        return this.highViewRate + this.hasViews + this.highConversionRate + this.hasConversions;
      },
    };

    this.#identityValues.clusterManager
      .get(this.#identityValues.originatingClusterId)
      .getAllIdentitiesOf(UrlAndPageIdentity.type).forEach((identity) => {
        if (identity.pageViews > (this.#maxViews / 2)) {
          rv.highViewRate = 25;
        }
        if (identity.pageViews > this.#minRumValue) {
          rv.hasViews = 25;
        }
        if (identity.conversions > (this.#maxConversions / 2)) {
          rv.highConversionRate = 25;
        }
        if (identity.conversions > this.#minRumValue) {
          rv.hasConversions = 25;
        }
      });
    return rv;
  }

  get accessibilityScore() {
    const rv = {
      includesAltText: 45,
      doesNotIncludeRedAndGreen: 45,
      doesNotIncludeYellowAndBlue: 10,
      get total() {
        return this.includesAltText
        + this.doesNotIncludeRedAndGreen
        + this.doesNotIncludeYellowAndBlue;
      },
      // TODO: High Contrast
    };

    let foundImageWithoutAltText = false;
    const cluster = this.#identityValues.clusterManager
      .get(this.#identityValues.originatingClusterId);
    cluster
      .getAllIdentitiesOf(UrlAndPageIdentity.type).forEach((identity) => {
        if (!identity.alt) {
          foundImageWithoutAltText = true;
        }
      });
    if (foundImageWithoutAltText) {
      rv.includesAltText = 0;
    }

    let foundRed = false;
    let foundGreen = false;
    let foundYellow = false;
    let foundBlue = false;
    cluster.getSingletonOf(ColorIdentity.type).topColors.forEach((color) => {
      const strColor = `${color}`.toLowerCase();
      if (strColor.includes('red')) {
        foundRed = true;
      }
      if (strColor.includes('green')) {
        foundGreen = true;
      }
      if (strColor.includes('yellow')) {
        foundYellow = true;
      }
      if (strColor.includes('blue')) {
        foundBlue = true;
      }
    });
    if (foundRed && foundGreen) {
      rv.doesNotIncludeRedAndGreen = 0;
    }
    if (foundYellow && foundBlue) {
      rv.doesNotIncludeYellowAndBlue = 0;
    }
    return rv;
  }

  get onBrandScore() {
    const rv = {
      total: 0,
    };

    const cluster = this.#identityValues.clusterManager
      .get(this.#identityValues.originatingClusterId);
    const { topColors } = cluster.getSingletonOf(ColorIdentity.type);

    // Iterate over onBrandColors and calculate score only for matches in topColors
    this.#onBrandColors.forEach((color) => {
      if (topColors.includes(color)) {
        const score = 100 / this.#onBrandColors.size;
        rv[`onBrandColor${color}`] = score;
        rv.total += score;
      } else {
        rv[`onBrandColor${color}`] = 0; // Explicitly set score to 0 for unmatched colors
      }
    });

    return rv;
  }

  get bestWebPracticesScore() {
    const rv = {
      imageShouldNotHaveEmbeddedText: 50,
      fileSizedForWeb: 50,
      get total() { return this.imageShouldNotHaveEmbeddedText + this.fileSizedForWeb; },
      // ... more to come
    };

    const cluster = this.#identityValues.clusterManager
      .get(this.#identityValues.originatingClusterId);
    cluster
      .getAllIdentitiesOf(SizeIdentity.type).forEach((identity) => {
        if (identity.tooBigForWeb) {
          rv.fileSizedForWeb = 0;
        }
      });
    if (cluster.getSingletonOf(TextIdentity.type)?.hasWords) {
      rv.imageShouldNotHaveEmbeddedText = 0;
    }

    return rv;
  }

  // eslint-disable-next-line no-unused-vars
  mergeOther(otherIdentity) {
    // nothing to merge. This is completely stateless.
  }
}

export default Lighthouse;

IdentityRegistry.register(Lighthouse);
