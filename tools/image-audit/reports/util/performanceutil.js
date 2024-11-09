class PerformanceUtil {
  static getPerformanceScore(conversions, pageViews, visits, round) {
    if (pageViews > 0 && conversions > 0) {
      const rv = Math.round((100 * (conversions / pageViews)));
      if (!round) return rv;
      return Math.min(Math.round((rv + 5) / 10) * 10, 100);
    }
    if (visits === 0 && pageViews === 0) return 0;
    if (visits * 2 >= pageViews) return 5;
    return 1;
  }

  static decorateReportData(row, conversions, pageViews, visits, bounces) {
    row.set('Performance Score', PerformanceUtil.getPerformanceScore(conversions, pageViews, visits, true) || '');
    row.set('Page Views', pageViews > 0 ? pageViews : ' < 100');
    row.set('Conversions', conversions > 0 ? conversions : ' < 100');
    row.set('Visits', visits > 0 ? visits : ' < 100');
    row.set('Bounces', bounces > 0 ? bounces : ' < 100');
  }
}

export default PerformanceUtil;
