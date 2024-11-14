class NamingUtil {
  static formatPropertyNameForUI(propertyName) {
    if (!propertyName) return '-';
    return propertyName
      .replace(/([A-Z])/g, ' $1') // Insert a space before each uppercase letter
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
      .trim(); // Trim any leading spaces
  }
}

export default NamingUtil;
