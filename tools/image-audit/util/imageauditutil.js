class ImageAuditUtil {
  static getFileType(src) {
    const fileType = src.split('.')
      .pop().split('?')
      .shift()
      .toLowerCase();
    return fileType;
  }
}

export default ImageAuditUtil;
