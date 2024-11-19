class Hash {
  // eslint-disable-next-line class-methods-use-this
  static async createHash(value) {
    // crypto only available on https.
    if (!crypto?.subtle?.digest) {
      throw new Error('crypto.subtle.digest not available. Try calling with https.');
    }
    let hashBuffer = null;
    const encoder = new TextEncoder();
    if (typeof value === 'string') {
      hashBuffer = await crypto.subtle.digest('SHA-1', new Uint8Array(encoder.encode(value)));
    } else {
      hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(encoder.encode(new Uint8Array(value))));
    }

    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
    const rv = hashArray.map((byte) => byte.toString(36).padStart(2, '0')).join('');
    return rv;
  }
}

export default Hash;
