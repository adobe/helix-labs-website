import { sampleRUM } from '../../scripts/aem.js';
import pLimit from 'https://cdn.skypack.dev/p-limit@4.0.0';

const parallelism = new URL(window.location.href).searchParams.get('parallelism');
// parse number
const limit = pLimit(parallelism ? parseInt(parallelism) : 10);

async function getResult(url) {
  console.log(`fetching: ${url}`);
  const resp = await limit(() => fetch(`https://thinktanked.org/deep-psi?url=${encodeURI(url)}`));
  const json = await resp.json();
  return json;
}

async function getResults(url, samples) {
  const reqs = [];
  for (let i = 0; i < samples; i += 1) {
    reqs.push(getResult(`${url}${url.includes('?') ? '&' : '?'}ck=${Math.random()}`));
  }
  return await Promise.all(reqs);
}

function createTable(results, averages) {
  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-container';
  
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  const keys = Object.keys(results[0]);
  
  // Add headers for metrics
  keys.forEach((key) => {
    const th = document.createElement('th');
    th.textContent = key;
    tr.append(th);
  });
  
  // Add score header
  const scoreTh = document.createElement('th');
  scoreTh.textContent = 'Score';
  scoreTh.style.textAlign = 'center';
  tr.append(scoreTh);
  
  thead.append(tr);
  table.append(thead);

  const tbody = document.createElement('tbody');
  const totals = {};
  results.forEach((result) => {
    const tr = document.createElement('tr');
    keys.forEach((key) => {
      const td = document.createElement('td');
      let value = result[key];
      totals[key] = totals[key] ? totals[key] + value : value;
      if (key === 'CLS') {
        value = Math.round(value * 1000) / 1000;
      } else {
        // Convert milliseconds to seconds for time-based metrics
        if (['FCP', 'SI', 'LCP', 'TTI', 'TBT'].includes(key)) {
          value = Math.round((value / 1000) * 100) / 100; // Round to 2 decimal places
        } else {
          value = Math.round(value);
        }
      }
      td.textContent = value;
      td.style.color = getPerformanceColor(key, value);
      td.style.fontWeight = 'bold';
      tr.append(td);
    });
    
    // Add score column
    const scoreTd = document.createElement('td');
    
    // Convert result values to seconds for score calculation
    const scoreMetrics = {};
    Object.keys(result).forEach(key => {
      if (['FCP', 'SI', 'LCP', 'TTI', 'TBT'].includes(key)) {
        scoreMetrics[key] = Math.round((result[key] / 1000) * 100) / 100;
      } else {
        scoreMetrics[key] = result[key];
      }
    });
    
    const score = calculatePerformanceScore(scoreMetrics);
    const scoreInfo = getScoreColor(score);
    scoreTd.innerHTML = `<div class="score-container"><div class="score-circle" style="background-color: ${scoreInfo.color}; color: white;">${score}</div></div>`;
    scoreTd.style.textAlign = 'center';
    tr.append(scoreTd);
    
    tbody.append(tr);
  });

  const avg = document.createElement('tr');

  keys.forEach((key) => {
    const td = document.createElement('td');
    let psiVal = lowestCluster(keytoarray(results, key));
    let value = mean(keytoarray(results, key));
    let deviation = stddev(keytoarray(results, key));
    if (key === 'CLS') {
      value = Math.round(value * 1000) / 1000;
      psiVal = Math.round(psiVal * 1000) / 1000;
    } else {
      // Convert milliseconds to seconds for time-based metrics
      if (['FCP', 'SI', 'LCP', 'TTI', 'TBT'].includes(key)) {
        value = Math.round((value / 1000) * 100) / 100;
        psiVal = Math.round((psiVal / 1000) * 100) / 100;
      } else {
        value = Math.round(value);
        psiVal = Math.round(psiVal);
      }
    }
    averages[key] = psiVal;
    const color = getPerformanceColor(key, psiVal);
    
    // Format the deviation to be more readable
    let formattedDeviation;
    if (key === 'CLS') {
      formattedDeviation = Intl.NumberFormat({ maximumSignificantDigits: 3 }).format(deviation);
    } else {
      // For time-based metrics, format deviation in seconds with appropriate precision
      const deviationInSeconds = deviation / 1000;
      formattedDeviation = Intl.NumberFormat({ maximumSignificantDigits: 2 }).format(deviationInSeconds);
    }
    
    td.innerHTML = `<span style="color: ${color}; font-weight: bold;">${psiVal}</span><br><small style="color: var(--gray-600); font-size: 0.9em;">(${value} ± ${formattedDeviation})</small>`;
    avg.append(td);
  });
  
  // Add average score column
  const avgScoreTd = document.createElement('td');
  const avgMetrics = {};
  keys.forEach(key => {
    let rawValue = lowestCluster(keytoarray(results, key));
    // Convert to seconds for time-based metrics
    if (['FCP', 'SI', 'LCP', 'TTI', 'TBT'].includes(key)) {
      avgMetrics[key] = Math.round((rawValue / 1000) * 100) / 100;
    } else {
      avgMetrics[key] = rawValue;
    }
  });
  console.log('Average metrics for score calculation:', avgMetrics);
  const avgScore = calculatePerformanceScore(avgMetrics);
  const avgScoreInfo = getScoreColor(avgScore);
  avgScoreTd.innerHTML = `<div class="score-container"><div class="score-circle" style="background-color: ${avgScoreInfo.color}; color: white;">${avgScore}</div></div>`;
  avgScoreTd.style.textAlign = 'center';
  avg.append(avgScoreTd);

  avg.className = 'average';

  tbody.append(avg);
  table.append(tbody);
  tableContainer.append(table);
  return tableContainer;
}

function lowestCluster(arr) {
  if (!arr || arr.length === 0) {
    return 0;
  }
  
  const sorted = arr.sort((a, b) => a - b);
  let clusterVal = 0;
  console.log(sorted);
  
  // Check for clusters of 3 identical values
  for (let i = 0; i < (sorted.length - 2); i += 1 ) {
    if (sorted[i] === sorted[i + 1] && sorted[i] === sorted[i + 2]) {
      console.log(clusterVal);
      clusterVal = sorted[i];
      break;
    }
  }
  
  // If no cluster found, calculate average of first 3 values
  if (!clusterVal) {
    if (sorted.length >= 3) {
      clusterVal = (sorted[0] + sorted[1] + sorted[2]) / 3;
    } else if (sorted.length === 2) {
      clusterVal = (sorted[0] + sorted[1]) / 2;
    } else {
      clusterVal = sorted[0];
    }
  }
  
  return clusterVal;
}

function keytoarray(arr, key) {
  return arr.map((item) => item[key]);
}

function mean(arr) {
  if (!arr || arr.length === 0) {
    return 0;
  }
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  if (!arr || arr.length < 2) {
    return 0;
  }
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / (arr.length - 1));
}

// Google PageSpeed Insights color thresholds (official values)
function getPerformanceColor(metric, value) {
  const thresholds = {
    'FCP': { good: 1.8, needsImprovement: 3.0 }, // First Contentful Paint (s) ✅
    'SI': { good: 3.4, needsImprovement: 5.8 }, // Speed Index (s) ✅
    'LCP': { good: 2.5, needsImprovement: 4.0 }, // Largest Contentful Paint (s) ✅
    'TTI': { good: 3.8, needsImprovement: 7.3 }, // Time to Interactive (s) ✅
    'TBT': { good: 0.2, needsImprovement: 0.6 }, // Total Blocking Time (s) ✅
    'CLS': { good: 0.1, needsImprovement: 0.25 } // Cumulative Layout Shift (unitless) ✅
  };
  
  const threshold = thresholds[metric];
  if (!threshold) return 'black';
  
  if (value <= threshold.good) return '#0cce6b'; // Green - Good
  if (value <= threshold.needsImprovement) return '#ffa400'; // Orange - Needs Improvement
  return '#f4442f'; // Red - Poor
}

// Calculate performance score based on Google's algorithm
function calculatePerformanceScore(metrics) {
  console.log('Calculating score for metrics:', metrics);
  
  const weights = {
    'FCP': 0.15,
    'SI': 0.15,
    'LCP': 0.25,
    'TTI': 0.15,
    'TBT': 0.25,
    'CLS': 0.05
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.keys(weights).forEach(metric => {
    if (metrics[metric] !== undefined) {
      let value = metrics[metric];
      
      // Use thresholds in seconds since metrics are now in seconds (official Google PSI values)
      const thresholds = {
        'FCP': { good: 1.8, needsImprovement: 3.0 },
        'SI': { good: 3.4, needsImprovement: 5.8 },
        'LCP': { good: 2.5, needsImprovement: 4.0 },
        'TTI': { good: 3.8, needsImprovement: 7.3 },
        'TBT': { good: 0.2, needsImprovement: 0.6 },
        'CLS': { good: 0.1, needsImprovement: 0.25 }
      };
      
      const threshold = thresholds[metric];
      let score;
      
      if (value <= threshold.good) {
        score = 100;
      } else if (value <= threshold.needsImprovement) {
        score = 100 - ((value - threshold.good) / (threshold.needsImprovement - threshold.good)) * 30;
      } else {
        score = Math.max(0, 100 - ((value - threshold.needsImprovement) / threshold.needsImprovement) * 70);
      }
      
      console.log(`${metric}: value=${value}, score=${score}, weight=${weights[metric]}`);
      totalScore += score * weights[metric];
      totalWeight += weights[metric];
    }
  });
  
  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  console.log('Final score:', finalScore);
  return finalScore;
}

// Get score color and indicator
function getScoreColor(score) {
  if (score >= 90) return { color: '#0cce6b', indicator: '●' }; // Green circle
  if (score >= 50) return { color: '#ffa400', indicator: '■' }; // Orange square
  return { color: '#f4442f', indicator: '▲' }; // Red triangle
}

/**
 * @param {number[]} arr1 - array of numbers
 * @param {number[]} arr2 - array of numbers
 * @returns {Promise<number>} - the p-value of the two independent samples
 */
async function significancetest(arr1, arr2) {
  // Dynamically load jStat only when needed
  if (typeof jStat === 'undefined') {
    await loadJStat();
  }
  
  const n1 = arr1.length;
  const n2 = arr2.length;
  const mean1 = mean(arr1);
  const mean2 = mean(arr2);
  const stddev1 = stddev(arr1);
  const stddev2 = stddev(arr2);
  const pooledstddev = Math.sqrt(((n1 - 1) * stddev1 * stddev1 + (n2 - 1) * stddev2 * stddev2) / (n1 + n2 - 2));
  const t = (mean1 - mean2) / (pooledstddev * Math.sqrt(1 / n1 + 1 / n2));
  const df = n1 + n2 - 2;
  const p = 1 - jStat.studentt.cdf(Math.abs(t), df);
  return p;
}

// Function to dynamically load jStat
async function loadJStat() {
  return new Promise((resolve, reject) => {
    if (typeof jStat !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = '//cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load jStat'));
    document.head.appendChild(script);
  });
}

async function comparePSI() {
  // Show loading animation
  showLoadingAnimation();
  
  // Get URL values
  const url1 = document.getElementById('url1')?.value;
  const url2 = document.getElementById('url2')?.value;
  
  if (!url1) {
    hideLoadingAnimation();
    return;
  }
  
  // Show single loading message
  const output1 = document.getElementById('output1');
  const output2 = document.getElementById('output2');
  
  if (output1) {
    output1.innerHTML = '';
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'status-message';
    loadingDiv.textContent = url2 ? 'Fetching reports for both URLs...' : 'Fetching report for URL...';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.gridColumn = '1 / -1';
    
    output1.appendChild(loadingDiv);
  }
  
  if (output2) {
    output2.innerHTML = '';
  }
  
  // Execute PSI for first URL
  const res1 = await executePSI(1);
  if (!res1) {
    hideLoadingAnimation();
    return;
  }
  
  // Execute PSI for second URL only if provided
  let res2 = null;
  if (url2) {
    res2 = await executePSI(2);
    if (!res2) {
      hideLoadingAnimation();
      return;
    }
  }
  
  // Only show significance test if both URLs have results
  if (res1 && res2) {
    console.log(keytoarray(res1, 'LCP'), keytoarray(res2, 'LCP'));
    
    // Show significance test section
    const significanceContainer = document.getElementById('psi-significance-container');
    if (significanceContainer) {
      significanceContainer.style.display = 'block';
    }
    
    const significancetestresults = document.getElementById('significancetestresults');
    if (significancetestresults) {
      significancetestresults.innerHTML = ''; // Clear previous results
      
      // Process significance tests asynchronously
      const significancePromises = Object.keys(res1[0]).map(async (key) => {
        try {
          const p = await significancetest(keytoarray(res1, key), keytoarray(res2, key));
          const li = document.createElement('li');
          li.innerHTML = `<code>${key}</code>: ${Intl.NumberFormat({ maximumSignificantDigits: 3 }).format(p)}`;
          return li;
        } catch (error) {
          console.error(`Error calculating significance for ${key}:`, error);
          const li = document.createElement('li');
          li.innerHTML = `<code>${key}</code>: Error calculating significance`;
          return li;
        }
      });
      
      // Wait for all significance tests to complete
      const significanceResults = await Promise.all(significancePromises);
      significanceResults.forEach(li => significancetestresults.append(li));
    }
  }
  
  // Hide loading animation
  hideLoadingAnimation();
}

async function executePSI(num) {
  const urlElement = document.getElementById('url' + num);
  if (!urlElement) {
    console.error(`URL element url${num} not found`);
    return null;
  }
  const url = urlElement.value;
  if (!url) return;
  const output = document.getElementById('output' + num);
  if (!output) {
    console.error(`Output element output${num} not found`);
    return null;
  }
  
  // Clear previous content (loading message is handled centrally)
  output.innerHTML = '';
  
  // Add URL header above the table
  const urlHeader = document.createElement('h3');
  urlHeader.className = 'table-url-header loading';
  urlHeader.innerHTML = `<span class="loading-spinner"></span> Loading URL ${num}...`;
  output.appendChild(urlHeader);
  
  // Determine number of API calls based on environment
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiCalls = isLocalhost ? 2 : 20;
  const rawResults = await getResults(url, apiCalls);
  const categs = ['first-contentful-paint', 'speed-index', 'largest-contentful-paint', 'interactive', 'total-blocking-time', 'cumulative-layout-shift'];
  const names = ['FCP', 'SI', 'LCP', 'TTI', 'TBT', 'CLS'];
  const results = rawResults.map((result) => {
    const cleaned = {};
    // Check if the result has the expected structure
    if (!result || !result.lighthouseResult || !result.lighthouseResult.audits) {
      console.error('Invalid PSI result structure:', result);
      // Return null to filter out failed results
      return null;
    }
    
    categs.forEach((categ, i) => {
      try {
        const audit = result.lighthouseResult.audits[categ];
        if (audit && typeof audit.numericValue === 'number') {
          cleaned[names[i]] = audit.numericValue;
        } else {
          console.warn(`Missing or invalid audit for ${categ}:`, audit);
          cleaned[names[i]] = 0; // Default value for missing data
        }
      } catch (error) {
        console.error(`Error processing audit ${categ}:`, error);
        cleaned[names[i]] = 0; // Default value for errors
      }
    });
    return cleaned;
  }).filter(result => result !== null); // Remove failed results
  
  // Check if we have any valid results
  if (results.length === 0) {
    output.innerHTML = '<div class="error-message">No valid PSI results obtained. Please check the URL and try again.</div>';
    return null;
  }
  
  const avgs = {};
  output.append(createTable(results, avgs));
  
  // Update URL header to show final URL and remove loading state
  const existingUrlHeader = output.querySelector('.table-url-header');
  if (existingUrlHeader) {
    existingUrlHeader.className = 'table-url-header';
    existingUrlHeader.textContent = `URL ${num}: ${url}`;
  }
  
  const p = document.createElement('p');
  p.innerHTML = `<a target="_blank" href="https://googlechrome.github.io/lighthouse/scorecalc/#FCP=${avgs.FCP}&TTI=${avgs.TTI}&SI=${avgs.SI}&TBT=${avgs.TBT}&LCP=${avgs.LCP}&CLS=${avgs.CLS}&device=mobile&version=10">Overall Best Stable Score</a>`;

  const avgScore = (r, k) => {
    return mean(keytoarray(r, k));
  }
  
  p.innerHTML += `<br><a target="_blank" href="https://googlechrome.github.io/lighthouse/scorecalc/#FCP=${avgScore(results, 'FCP')}&TTI=${avgScore(results, 'TTI')}&SI=${avgScore(results, 'SI')}&TBT=${avgScore(results, 'TBT')}&LCP=${avgScore(results, 'LCP')}&CLS=${avgScore(results, 'CLS')}&device=mobile&version=10">Overall Average Score</a>`;
  output.append(p);

  // Remove loading message
  const loadingMessage = output.querySelector('.status-message');
  if (loadingMessage) {
    loadingMessage.remove();
  }

  return results;
}

// Loading animation functions
function showLoadingAnimation() {
  const submitButton = document.getElementById('button');
  const resetButton = document.querySelector('button[type="reset"]');
  const clearCheckbox = document.getElementById('clear');
  
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-spinner"></span> Loading...';
  }
  
  if (resetButton) {
    resetButton.disabled = true;
  }
  
  if (clearCheckbox) {
    clearCheckbox.disabled = true;
  }
}

function hideLoadingAnimation() {
  const submitButton = document.getElementById('button');
  const resetButton = document.querySelector('button[type="reset"]');
  const clearCheckbox = document.getElementById('clear');
  
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit';
  }
  
  if (resetButton) {
    resetButton.disabled = false;
  }
  
  if (clearCheckbox) {
    clearCheckbox.disabled = false;
  }
}

// Initialize the form and event listeners
function initializeForm() {
  const form = document.getElementById("psi-form");
  if (!form) {
    console.error("Form element psi-form not found");
    return;
  }
  
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const url = new URL(window.location);
    url.searchParams.set('url1', document.getElementById('url1').value);
    url.searchParams.set('url2', document.getElementById('url2').value);
    window.history.pushState({}, '', url);

    const clearCheckbox = document.getElementById('clear');
    const output1 = document.getElementById('output1');
    const output2 = document.getElementById('output2');
    const significanceResults = document.getElementById('significancetestresults');
    const significanceContainer = document.getElementById('psi-significance-container');
    
    if (clearCheckbox && clearCheckbox.checked) {
      if (output1) output1.innerHTML = '';
      if (output2) output2.innerHTML = '';
      if (significanceResults) significanceResults.innerHTML = '';
      if (significanceContainer) significanceContainer.style.display = 'none';
    }

    comparePSI();
  });

  const params = new URLSearchParams(window.location.search);
  const url1 = params.get('url1');
  const url2 = params.get('url2');
  
  const url1Element = document.getElementById('url1');
  const url2Element = document.getElementById('url2');
  
  if (url1 && url1Element) url1Element.value = url1;
  if (url2 && url2Element) url2Element.value = url2;
  
  // Add event listener for clear checkbox
  const clearCheckbox = document.getElementById('clear');
  if (clearCheckbox) {
    clearCheckbox.addEventListener('change', () => {
      if (clearCheckbox.checked) {
        const output1 = document.getElementById('output1');
        const output2 = document.getElementById('output2');
        const significanceResults = document.getElementById('significancetestresults');
        const significanceContainer = document.getElementById('psi-significance-container');
        
        if (output1) output1.innerHTML = '';
        if (output2) output2.innerHTML = '';
        if (significanceResults) significanceResults.innerHTML = '';
        if (significanceContainer) significanceContainer.style.display = 'none';
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeForm);
} else {
  initializeForm();
}

sampleRUM.enhance(); 