class CrawlerImageValues {
  #site;

  #origin;

  #src;

  #cardSrc;

  #detailSrc;

  #alt;

  #width;

  #height;

  #cardWidth;

  #cardHeight;

  #invalidDimensions;

  #aspectRatio;

  #instance;

  #fileType;

  constructor({
    site,
    origin,
    src,
    cardSrc,
    detailSrc,
    alt,
    width,
    height,
    cardWidth,
    cardHeight,
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
    this.#cardWidth = cardWidth;
    this.#cardHeight = cardHeight;
    this.#invalidDimensions = invalidDimensions;
    this.#aspectRatio = aspectRatio;
    this.#instance = instance;
    this.#fileType = fileType;
    this.#cardSrc = cardSrc;
    this.#detailSrc = detailSrc;
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

  get cardSrc() {
    return this.#cardSrc;
  }

  get detailSrc() {
    return this.#detailSrc;
  }

  get cardWidth() {
    return this.#cardWidth;
  }

  get cardHeight() {
    return this.#cardHeight;
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
