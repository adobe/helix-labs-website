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
}

export default CrawlerImageValues;
