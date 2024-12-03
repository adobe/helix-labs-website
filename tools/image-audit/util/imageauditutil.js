class ImageAuditUtil {
  static getFileType(src) {
    if (src.includes('?')) return this.getFileType(src.split('?')[0]);

    const fileType = src.split('.')
      .pop()
      .toLowerCase();
    return fileType;
  }
}

export default ImageAuditUtil;
