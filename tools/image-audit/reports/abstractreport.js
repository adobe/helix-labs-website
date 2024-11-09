class AbstractReport {
  static get uiName() {
    const className = this.name; // Get the name of the class
    return className.replace(/([A-Z])/g, ' $1').trim(); // Add space before each uppercase letter
  }

  static get id() {
    return this.name.toLowerCase(); // Convert class name to lowercase
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  static async generateReport(clusterManager) {
    throw new Error('generateReport must be implemented by subclass');
  }
}

export default AbstractReport;
