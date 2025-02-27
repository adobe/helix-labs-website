class ReportRegistry {
  static #reports = new Set();

  static register(report) {
    ReportRegistry.#reports.add(report);
  }

  static getReports() {
    return Array.from(ReportRegistry.#reports);
  }

  static getReport(id) {
    return Array.from(ReportRegistry.#reports).find((report) => report.id === id) || null;
  }
}

export default ReportRegistry;
