class CrawlerImageValues {
  #site;

  #origin;

  #src;

  #alt;

  #width;

  #height;

  #aspectRatio;

  #instance;

  #fileType;

  constructor({
    site,
    origin,
    src,
    alt,
    width,
    height,
    aspectRatio,
    instance,
    fileType,
  }) {
    this.#site = site;
    this.#origin = origin;
    this.#src = src;
    this.#alt = alt;
    this.#width = width;
    this.#height = height;
    this.#aspectRatio = aspectRatio;
    this.#instance = instance;
    this.#fileType = fileType;
  }

  get site() {
    return this.#site;
  }

  get origin() {
    return this.#origin;
  }

  get src() {
    return this.#src;
  }

  get alt() {
    return this.#alt;
  }

  get width() {
    return this.#width;
  }

  get height() {
    return this.#height;
  }

  get aspectRatio() {
    return this.#aspectRatio;
  }

  get instance() {
    return this.#instance;
  }

  get fileType() {
    return this.#fileType;
  }
}

export default CrawlerImageValues;
