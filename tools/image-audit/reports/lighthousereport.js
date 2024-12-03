import AbstractReport from './abstractreport.js';
import ReportData from './reportdata.js';
import ReportRegistry from './reportregistry.js';
import LighthouseIdentity from '../identity/imageidentity/lighthouseidentity.js';
import NamingUtil from './util/namingutil.js';

class LighthouseReport extends AbstractReport {
  static async generateReport(clusterManager) {
    const reportData = new ReportData('Asset Success');
    clusterManager.getAllClusters().values().forEach((cluster) => {
      const lighthouse = cluster.getSingletonOf(LighthouseIdentity.type);
      const row = new Map(); // Create a new map for each row

      row.set('Page URLs With Asset', lighthouse.allPages.join(', ') || '');
      row.set('Asset URLs', lighthouse.allPages.join(', ') || '');
      // Iterate over each category in scores (excluding the 'total' property)

      const { scores } = lighthouse;

      // Assuming 'scores.total' contains the overall Lighthouse score
      const roundedOverallTotal = Math.round(scores.total);

      row.set('Success Score - Total', roundedOverallTotal);

      Object.keys(scores).forEach((category) => {
        if (category !== 'total' && Object.prototype.hasOwnProperty.call(scores, category)) {
          const categoryData = scores[category];

          // Convert the category name to a pretty name and round the total score
          const categoryName = NamingUtil.formatPropertyNameForUI(category);
          const roundedTotal = Math.round(categoryData.total);

          // Add the category name and total score
          row.set(`${categoryName} - Total`, roundedTotal);

          // If there are sub-scores, break them down
          Object.keys(categoryData).forEach((subscore) => {
            if (subscore !== 'total' && Object.prototype.hasOwnProperty.call(categoryData, subscore)) {
              const subscoreName = NamingUtil.formatPropertyNameForUI(subscore);
              const roundedScore = Math.round(categoryData[subscore]);
              row.set(subscoreName, roundedScore);
            }
          });
        }
      });

      // Add the populated row to the reportData
      reportData.addRowMap(row);
    });

    return reportData;
  }
}

export default LighthouseReport;

ReportRegistry.register(LighthouseReport);
