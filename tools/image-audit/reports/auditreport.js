import AbstractReport from './abstractreport.js';
import ReportData from './reportdata.js';
import ReportRegistry from './reportregistry.js';
import UrlAndPageIdentity from '../identity/imageidentity/urlandpageidentity.js';
import ColorIdentity from '../identity/imageidentity/coloridentity.js';
import PerformanceUtil from './util/performanceutil.js';

class AuditReport extends AbstractReport {
  static async generateReport(clusterManager) {
    const reportData = new ReportData('Site');
    clusterManager.getAllClusters().values().forEach((cluster) => {
      const upii = cluster.getFirstIdentityOf(UrlAndPageIdentity.type);
      const row = new Map(); // Create a new map for each row

      // Populate the row map based on available identifiers and columns
      row.set('Site', upii.site || ''); // Site
      row.set('Image Source', new URL(upii.src, upii.origin).href || ''); // Image Source
      row.set('Alt Text', upii.alt || ''); // Alt Text

      const ci = cluster.getSingletonOf(ColorIdentity.type);
      if (ci) {
        row.set('Top Colors', ci.topColorsSorted
          .map((color) => color.replace(/([a-z])([A-Z])/g, '$1 $2'))
          .join(', ') || ''); // Top Colors
      }

      const ti = cluster.getSingletonOf('text-identity');
      if (ti) {
        row.set('OCR Text', ti.text || ''); // OCR Text
      }

      if (window.collectingRum) {
        const pageViews = cluster.getAll(UrlAndPageIdentity.type, 'pageViews').reduce((acc, curr) => acc + curr, 0);
        const conversions = cluster.getAll(UrlAndPageIdentity.type, 'conversions').reduce((acc, curr) => acc + curr, 0);
        const visits = cluster.getAll(UrlAndPageIdentity.type, 'visits').reduce((acc, curr) => acc + curr, 0);
        const bounces = cluster.getAll(UrlAndPageIdentity.type, 'bounces').reduce((acc, curr) => acc + curr, 0);
        PerformanceUtil.decorateReportData(row, conversions, pageViews, visits, bounces, true);
      }

      // Add the populated row to the reportData
      reportData.addRowMap(row);
    });

    return reportData;
  }
}

export default AuditReport;

ReportRegistry.register(AuditReport);
