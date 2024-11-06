class Hash {
  static #hashInitialized = false;

  // eslint-disable-next-line class-methods-use-this
  static async createHash(value) {
    const previouslyHashInitialized = this.#hashInitialized;
    if (this.#hashInitialized === false) {
      this.#hashInitialized = true;
    }
    // crypto only available on https.
    if (crypto?.subtle?.digest) {
      if (!previouslyHashInitialized) {
        // eslint-disable-next-line no-console
        console.debug('Using crypto.subtle.digest for hashing');
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
      // if (typeof value === 'string') {
      // eslint-disable-next-line max-len
      //   console.debug(`Hashed ${value} to b16: ${hashArray.map((byte) => byte.toString(36).padStart(2, '0')).join('')} b36: ${rv}`);
      // }
      return rv;
    }

    if (!previouslyHashInitialized) {
      // eslint-disable-next-line no-console
      console.debug('Using CryptoJS hashing. Next time make the call with https');
    }
    let hash = null;
    if (typeof value === 'string') {
      // eslint-disable-next-line no-undef
      hash = CryptoJS.SHA1(CryptoJS.enc.Utf8.parse(value));
    } else {
      // eslint-disable-next-line no-undef
      hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(value));
    }

    // eslint-disable-next-line no-undef
    const hexHash = hash.toString(CryptoJS.enc.Hex); // Convert to hexadecimal format
    // eslint-disable-next-line no-undef
    const rv = BigInt(`0x${hexHash}`).toString(36);
    // if (typeof value === 'string') {
    //  console.debug(`Hashed ${value} to b16: ${hexHash} b36: ${rv}`);
    // }
    return rv;
  }
}

export default Hash;
