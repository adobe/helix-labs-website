/* eslint-disable class-methods-use-this */
import AbstractIdentity from '../abstractidentity.js';
import IdentityRegistry from '../identityregistry.js';
import ColorUtility from '../util/colorutility.js';
import SizeIdentity from './sizeidentity.js';

const ALPHA_ALLOWED_FORMATS = ['png', 'webp', 'gif', 'tiff'];

const numberOfTopColors = 10;
// const numberOfTopRawColors = 20;
// eslint-disable-next-line no-undef
const colorThief = new window.ColorThief();

const exactColorMatchThreshold = numberOfTopColors * 0.2;

const COLOR_IDENTITY_TYPE = 'color-identity';

class ColorIdentity extends AbstractIdentity {
  #usedColors;

  #topColors;

  constructor(identityState) {
    super('ci');
    if (!identityState.usedColors) {
      identityState.usedColors = new Set();
      Object.defineProperty(identityState, 'usedColorsSorted', {
        get() { return ColorUtility.sortColorNamesIntoArray(identityState.usedColors); },
      });
    }

    this.#usedColors = identityState.usedColors;
    this.#topColors = new Set();
  }

  static get type() {
    return COLOR_IDENTITY_TYPE;
  }

  static get uiSelectorProperties() {
    return {
      identity: ColorIdentity.type,
      display: 'Color',
      checked: true,
      hidden: false,
    };
  }

  get topColors() {
    return Array.from(this.#topColors);
  }

  get singleton() {
    return true;
  }

  get topColorsSorted() {
    return ColorUtility.sortColorNamesIntoArray(this.#topColors);
  }

  get allColorIdentitiesUsedColorsSorted() {
    return ColorUtility.sortColorNamesIntoArray(this.#usedColors);
  }

  get similarityCollaborator() {
    return true;
  }

  get allColorsSorted() {
    return ColorUtility.sortedColorNames;
  }

  mergeOther(otherIdentity) {
    // in theory they should be the same.
    otherIdentity.#topColors.forEach((color) => {
      if (!this.#topColors.has(color)) {
        this.#addUsedColor(color);
        this.#topColors.add(color);
      }
    });
  }

  // Function to calculate the Euclidean distance between two colors
  // eslint-disable-next-line class-methods-use-this
  static #colorDistance(color1, color2) {
    return Math.sqrt(
      (color1[0] - color2[0]) ** 2
      + (color1[1] - color2[1]) ** 2
      + (color1[2] - color2[2]) ** 2,
    );
  }

  // Function to find the nearest standard color
  static #findNearestColor(color) {
    return ColorUtility.cssColors.reduce((nearestColor, standardColor) => {
      const distance = ColorIdentity.#colorDistance(color, standardColor.rgb);
      return distance < ColorIdentity.#colorDistance(color, nearestColor.rgb)
        ? standardColor
        : nearestColor;
    }).name;
  }

  async getMergeWeight(otherIdentity) {
    const differentColors = await this.#getDifferentColors(otherIdentity);
    if (differentColors) {
      if (differentColors.length === 0) {
        return 20;
      } if (differentColors.length <= exactColorMatchThreshold / 2) {
        return 15;
      } if (differentColors.length <= exactColorMatchThreshold) {
        return 10;
      } if (differentColors.length <= exactColorMatchThreshold * 2) {
        return 5;
      }
    }
    return 0;
  }

  // another quick check to remove images with different top color palettes
  // Function to filter clusters based on color palette matching
  async #getDifferentColors(otherColorIdentity) {
    const colors = this.#topColors;
    const otherColors = otherColorIdentity.#topColors;

    // Symmetric difference between two sets of colors
    const diffColors = new Set([
      ...[...colors].filter((color) => !otherColors.has(color)),
      ...[...otherColors].filter((color) => !colors.has(color)),
    ]);

    return Array.from(diffColors);
  }

  get colorIndex() {
    // accounting for unknown and transparency
    const internalNumberOfTopColors = numberOfTopColors + 2;
    const colorIndices = new Array(internalNumberOfTopColors + 2).fill(0);

    const colorsArray = Array.from(this.#topColors);

    if (!colorsArray) {
      return 0;
    }

    for (let i = 0; i < internalNumberOfTopColors; i += 1) {
      if (colorsArray[i]) {
        colorIndices[i] = ColorUtility.sortedColorNames.indexOf(colorsArray[i]) + 1;
      }
    }

    const binaryString = colorIndices.map((num) => num.toString(2).padStart(7, '0')).join('');

    // Convert the binary string back into a regular number
    const combinedNumber = parseInt(binaryString, 2);
    return combinedNumber;
  }

  static async identifyPostflightWithCanvas(identityValues, identityState) {
    const { originatingClusterId, clusterManager, href } = identityValues;
    const colorIdentity = new ColorIdentity(identityState);

    const sizeIdentifier = clusterManager.get(originatingClusterId)
      .get(await SizeIdentity.getSizeId(href));
    if (sizeIdentifier?.tooBigForWeb) {
      // don't bother with large images.
      colorIdentity.#topColors.add(ColorUtility.UNKNOWN_NAME);
      colorIdentity.#addUsedColor(ColorUtility.UNKNOWN_NAME);
      return;
    }

    const results = await Promise.allSettled([
      ColorIdentity.#identifyColors(colorIdentity, identityValues),
      ColorIdentity.#identifyAlpha(colorIdentity, identityValues),
    ]);

    results
      .filter((result) => result.status === 'rejected')
      // eslint-disable-next-line no-console
      .forEach((error) => console.error('Error handling colors', error));

    if (!colorIdentity.#topColors.size === 0) {
      colorIdentity.#topColors.add(ColorUtility.UNKNOWN_NAME);
      colorIdentity.#addUsedColor(ColorUtility.UNKNOWN_NAME);
    }

    clusterManager.get(originatingClusterId).addIdentity(colorIdentity);
  }

  static async identifyPostError(identityValues, identityState) {
    const { originatingClusterId, clusterManager } = identityValues;
    let colorIdentity = clusterManager
      .get(originatingClusterId).getSingletonOf(COLOR_IDENTITY_TYPE);

    if (!colorIdentity) {
      colorIdentity = new ColorIdentity(identityState);
    }
    colorIdentity.#topColors.add(ColorUtility.UNKNOWN_NAME);
    colorIdentity.#addUsedColor(ColorUtility.UNKNOWN_NAME);
    clusterManager.get(originatingClusterId).addIdentity(colorIdentity);
  }

  static #getColors(elementForCluster) {
    const colors = numberOfTopColors > 1
      ? colorThief.getPalette(elementForCluster, numberOfTopColors)
      : [colorThief.getColor(elementForCluster)];

    // RGB Values. Disabled for now.
    // const rawColors = numberOfTopRawColors > 1
    //  ? colorThief.getPalette(elementForCluster, numberOfTopRawColors)
    //  : [colorThief.getColor(elementForCluster)];
    if (!colors) return [];
    return [...new Set(colors.map((color) => this.#findNearestColor(color)))];
  }

  // eslint-disable-next-line no-unused-vars
  static async #identifyColors(colorIdentity, identityValues) {
    const { originatingClusterId } = identityValues;
    const { elementForCluster } = identityValues.clusterManager.get(
      originatingClusterId,
    );

    try {
      if (elementForCluster === null) {
        throw new Error('No element for cluster');
      }

      const roundedColors = await identityValues
        .get(ColorIdentity, 'colors', async () => ColorIdentity.#getColors(elementForCluster));

      if (!(roundedColors) || roundedColors.length === 0) {
        // can be all alpha
        return;
      }

      roundedColors.forEach((color) => {
        colorIdentity.#topColors.add(color);
        colorIdentity.#addUsedColor(color);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('error identifying colors:', error);
      colorIdentity.#topColors.add(ColorUtility.UNKNOWN_NAME);
      colorIdentity.#addUsedColor(ColorUtility.UNKNOWN_NAME);
    }
  }

  static async #isAlpha(identityValues) {
    const { canvas, ctx } = identityValues;

    const ext = identityValues.fileType;
    if (!ALPHA_ALLOWED_FORMATS.includes(ext)) {
      return false;
    }

    // Get the pixel data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;

    const alphaThreshold = Math.min(data.length) * 0.01;
    let alphaPixelsCount = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        if (i % 1000 === 0) { // yield every 1000 pixels
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => { setTimeout(resolve, 0); });
        }
        alphaPixelsCount += 1;
        // only detecting alpha if 1% of pixels have alpha. This trims small alpha borders.
        // TODO: Should we limit this to the first xx pixels?
        if (alphaPixelsCount >= alphaThreshold) {
          return true;
        }
      }
    }
    return false;
  }

  static async #identifyAlpha(colorIdentity, identityValues) {
    const isAlpha = await identityValues
      .get(ColorIdentity, 'alpha', async () => ColorIdentity.#isAlpha(identityValues));

    if (isAlpha) {
      colorIdentity.#topColors.add(ColorUtility.TRANSPARENCY_NAME);
      colorIdentity.#addUsedColor(ColorUtility.TRANSPARENCY_NAME);
    }
  }

  /**
   * Utility to blindly add colors to the used color list.
   * @param {string} color - The color to be added to the used colors list.
   */
  // eslint-disable-next-line class-methods-use-this
  #addUsedColor(color) {
    if (!this.#usedColors.has(color)) {
      this.#usedColors.add(color);
    }
  }
}

IdentityRegistry.register(ColorIdentity);

export default ColorIdentity;
