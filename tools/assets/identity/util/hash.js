const TEXT_SHA = 'SHA-1';
const BIN_SHA = 'SHA-256';

class Hash {
  static async createHash(value) {
    const { digest, normalizedValue } = this.#normalizeValue(value);

    if (!crypto?.subtle?.digest) {
      throw new Error('crypto.subtle.digest not available. Ensure you are using HTTPS.');
    }

    const hashBuffer = await crypto.subtle.digest(digest, normalizedValue);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(36).padStart(2, '0')).join('');
  }

  static #normalizeValue(value) {
    const encoder = new TextEncoder();

    if (value === undefined) {
      return {
        digest: TEXT_SHA,
        normalizedValue: encoder.encode('{undefined}'),
      };
    }

    if (value === null) {
      return {
        digest: TEXT_SHA,
        normalizedValue: encoder.encode('{null}'),
      };
    }

    if (value === '') {
      return {
        digest: TEXT_SHA,
        normalizedValue: encoder.encode('{empty string}'),
      };
    }

    if (typeof value === 'string') {
      return {
        digest: TEXT_SHA, // Change to SHA-256 unless SHA-1 is required
        normalizedValue: encoder.encode(value),
      };
    }

    if (value instanceof Uint8Array) {
      return {
        digest: BIN_SHA,
        normalizedValue: value,
      };
    }

    if (value instanceof ArrayBuffer) {
      return {
        digest: BIN_SHA,
        normalizedValue: new Uint8Array(value),
      };
    }

    if (Array.isArray(value) && value.every((num) => typeof num === 'number' && num >= 0 && num <= 255)) {
      return {
        digest: BIN_SHA,
        normalizedValue: new Uint8Array(value),
      };
    }

    // Fallback for unknown types
    // eslint-disable-next-line no-console
    console.warn('Unknown value type; using JSON.stringify fallback:', typeof value);
    const fallbackValue = encoder.encode(JSON.stringify(value));
    return {
      digest: TEXT_SHA,
      normalizedValue: fallbackValue,
    };
  }
}

export default Hash;
