import { sampleRUM, loadScript } from '../../scripts/aem.js';
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

async function* getResultsGen(urls, samples) {
  const results = [];
  for (let i = 0; i < samples; i += 1) {
    urls.forEach((url) => {
      const result = getResult(`${url}${url.includes('?') ? '&' : '?'}ck=${Math.random()}`);
      results.push({ url, result });
    });
  }

  for (const result of results) {
    const res = await result.result;
    yield { rawResult: res, url: result.url };
  }
}

function createTable(results, averages) {
  const table = document.createElement('table');
  const tr = document.createElement('tr');
  const keys = Object.keys(results[0]);
  keys.forEach((key) => {
    const th = document.createElement('th');
    th.textContent = key;
    tr.append(th);
  });
  table.append(tr);

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
        value = Math.round(value);
      }
      td.textContent = value;
      tr.append(td);
    });
    table.append(tr);
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
      value = Math.round(value);
      psiVal = Math.round(psiVal);
    }
    averages[key] = psiVal;
    td.innerHTML = psiVal + '<br><code>(' + value + ' ± ' + Intl.NumberFormat({ maximumSignificantDigits: 1 }).format(deviation) + ')</code>';
    avg.append(td);
  });

  avg.className = 'average';

  table.append(avg);
  return table;
}

function lowestCluster(arr) {
  const sorted = arr.sort((a, b) => a - b);
  let clusterVal = 0;
  console.log(sorted);
  for (let i = 0; i < (sorted.length - 2); i += 1 ) {
    if (sorted[i] === sorted[i + 1] && sorted[i] === sorted[i + 2]) {
      console.log(clusterVal);
      clusterVal = sorted[i];
      break;
    }
  if (!clusterVal) clusterVal = (sorted[0] + sorted[1] + sorted[2]) / 3;
  }
  return clusterVal;
}

function keytoarray(arr, key) {
  return arr.map((item) => item[key]);
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / (arr.length - 1));
}

/**
 * @param {number[]} arr1 - array of numbers
 * @param {number[]} arr2 - array of numbers
 * @returns {number} - the p-value of the two independent samples
 */
function significancetest(arr1, arr2) {
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

async function comparePSI() {
  const [res1, res2] = await executePSIs();
  if (!res1 || !res2) return;

  await loadScript('https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js');

  console.log(keytoarray(res1, 'LCP'), keytoarray(res2, 'LCP'));
  console.log(significancetest(keytoarray(res1, 'LCP'), keytoarray(res2, 'LCP')));
  const significancetestresults = document.getElementById('significancetestresults');
  Object.keys(res1[0]).forEach((key) => {
    const p = significancetest(keytoarray(res1, key), keytoarray(res2, key));
    const li = document.createElement('li');
    li.innerHTML = `<code>${key}</code>: ${Intl.NumberFormat({ maximumSignificantDigits: 3 }).format(p)}`;
    significancetestresults.append(li);
  });
}

async function executePSIs() {
  const urls = [document.getElementById('url1').value, document.getElementById('url2').value];
  if (!urls[0] || !urls[1]) return;

  const outputs = [document.getElementById('output1'), document.getElementById('output2')];
  outputs.forEach((output, i) => {
    const status = document.createElement('p');
    status.className = 'status';
    status.textContent = `fetching report for: ${urls[i]}`;

    const loading = document.createElement('div');
    loading.className = 'loading';
    status.append(loading);

    output.append(status);
  });

  const categs = ['first-contentful-paint', 'speed-index', 'largest-contentful-paint', 'interactive', 'total-blocking-time', 'cumulative-layout-shift'];
  const names = ['FCP', 'SI', 'LCP', 'TTI', 'TBT', 'CLS'];
  const results = [[], []];
  const avgs = [{}, {}];
  const tables = [];
  for await (const resultObj of getResultsGen(urls, 20)) {
    const { rawResult, url } = resultObj;
    const urlIndex = urls.indexOf(url);

    const cleaned = {};
    categs.forEach((categ, i) => {
      cleaned[names[i]] = rawResult.lighthouseResult.audits[categ].numericValue;
    });
    
    const result = results[urlIndex];
    result.push(cleaned);

    if (tables[urlIndex]) tables[urlIndex].remove();
    const table = createTable(result, avgs[urlIndex]);
    outputs[urlIndex].append(table);
    tables[urlIndex] = table;
  }

  const avgScore = (r, k) => {
    return mean(keytoarray(r, k));
  }

  avgs.forEach((avg, i) => {
    outputs[i].querySelector('.status').remove();

    const p = document.createElement('p');
    p.innerHTML = `<a target="_blank" href="https://googlechrome.github.io/lighthouse/scorecalc/#FCP=${avg.FCP}&TTI=${avg.TTI}&SI=${avg.SI}&TBT=${avg.TBT}&LCP=${avg.LCP}&CLS=${avg.CLS}&device=mobile&version=10">Overall Best Stable Score</a>`;  

      
    p.innerHTML += `<br><a target="_blank" href="https://googlechrome.github.io/lighthouse/scorecalc/#FCP=${avgScore(results[i], 'FCP')}&TTI=${avgScore(results[i], 'TTI')}&SI=${avgScore(results[i], 'SI')}&TBT=${avgScore(results[i], 'TBT')}&LCP=${avgScore(results[i], 'LCP')}&CLS=${avgScore(results[i], 'CLS')}&device=mobile&version=10">Overall Average Score</a>`;
    outputs[i].append(p);
  });


  return results;
}

document.getElementById("button").addEventListener("click", () => {
  const url = new URL(window.location);
  url.searchParams.set('url1', document.getElementById('url1').value);
  url.searchParams.set('url2', document.getElementById('url2').value);
  window.history.pushState({}, '', url);


  if (document.getElementById('clear').checked) {
    document.getElementById('output1').innerHTML = '';
    document.getElementById('output2').innerHTML = '';
    document.getElementById('significancetestresults').innerHTML = '';
  }

  comparePSI();
});

const params = new URLSearchParams(window.location.search);
const url1 = params.get('url1');
const url2 = params.get('url2');
if (url1) document.getElementById('url1').value = url1;
if (url2) document.getElementById('url2').value = url2;

sampleRUM.enhance();
