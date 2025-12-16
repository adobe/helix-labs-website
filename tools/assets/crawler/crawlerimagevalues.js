class CrawlerImageValues {
  #site;

  #origin;

  #src;

  #alt;

  #invalidDimensions;

  #aspectRatio;

  #instance;

  #fileType;

  #imageOptions;

  #width;

  #height;

  #pageLastModified;

  #assetLastModified;

  constructor({
    site,
    origin,
    src,
    imageOptions,
    alt,
    width,
    height,
    invalidDimensions,
    aspectRatio,
    instance,
    fileType,
    pageLastModified,
    assetLastModified,
  }) {
    this.#site = site;
    this.#origin = origin;
    this.#src = src;
    this.#alt = alt;
    this.#width = width;
    this.#height = height;
    this.#invalidDimensions = invalidDimensions;
    this.#aspectRatio = aspectRatio;
    this.#instance = instance;
    this.#fileType = fileType;
    this.#imageOptions = imageOptions;
    this.#pageLastModified = pageLastModified;
    this.#assetLastModified = assetLastModified;
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

  get imageOptions() {
    return this.#imageOptions;
  }

  get aspectRatio() {
    return this.#aspectRatio;
  }

  get invalidDimensions() {
    return this.#invalidDimensions;
  }

  get instance() {
    return this.#instance;
  }

  get fileType() {
    return this.#fileType;
  }

  get pageLastModified() {
    return this.#pageLastModified;
  }

  get assetLastModified() {
    return this.#assetLastModified;
  }
}

export default CrawlerImageValues;
