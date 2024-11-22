class TextUtility {
  static compareWords(fText, fOtherText) {
    const returnValue = {
      exactMatch: false,
      wordDifferencePercentage: 1,
      bothSidesHadWords: false,
    };

    const otherText = fOtherText();
    const text = fText();
    if (!text || !otherText) {
      returnValue.bothSidesHadWords = false;
      return returnValue;
    }

    const identificationText = new Set(text.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(' '));
    if (identificationText.has('')) {
      identificationText.delete('');
    }

    if (!identificationText.size) {
      returnValue.bothSidesHadWords = false;
      return returnValue;
    }

    const otherIdentificationText = new Set(otherText.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(' '));
    if (otherIdentificationText.has('')) {
      otherIdentificationText.delete('');
    }

    if (!otherIdentificationText.size) {
      returnValue.bothSidesHadWords = false;
      return returnValue;
    }

    returnValue.bothSidesHadWords = true;

    if (text === otherText) {
      returnValue.exactMatch = true;
      returnValue.wordDifferencePercentage = 0;
      return returnValue;
    }

    returnValue.exactMatch = false;
    // Symmetric difference between two sets of colors
    const diffText = new Set([
      ...[...identificationText].filter((word) => !otherIdentificationText.has(word)),
      ...[...otherIdentificationText].filter((word) => !identificationText.has(word)),
    ]);

    const moreWords = Math.max(identificationText.length, otherIdentificationText.length);
    returnValue.wordDifferencePercentage = diffText.length / moreWords;
    return returnValue;
  }
}

export default TextUtility;
