# Assets Open Workbench

**Assets Open Workbench** is an open-source tool for analyzing image assets from various sources across websites. It crawls sitemaps, extracts images, identifies duplicates using multiple identification strategies, and provides sorting, filtering, and reporting capabilities.

## Purpose

The tool helps web teams:
- **Audit image assets** across entire websites via sitemap crawling
- **Detect duplicate images** using multiple identification methods (URL, perceptual hash, color, size, etc.)
- **Analyze image metadata** including dimensions, aspect ratios, colors, and alt text
- **Integrate RUM (Real User Monitoring) data** for performance-aware asset analysis
- **Generate reports** for asset auditing and lighthouse scoring

---

## Architecture

The system is built around a **modular, registry-based architecture** with pluggable components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        scripts.js (Main)                        │
├─────────────┬─────────────┬─────────────┬──────────┬───────────┤
│   Crawler   │  Identity   │    Sort     │  Filter  │  Reports  │
│   Registry  │  Registry   │   Registry  │ Registry │  Registry │
├─────────────┼─────────────┼─────────────┼──────────┼───────────┤
│ • Sitemap   │ • URL       │ • Count     │ • Shape  │ • Audit   │
│ • File      │ • Perceptual│ • Aspect    │ • Color  │ • Lthouse │
│ • URL       │ • Color     │ • Lighthouse│ • Alt    │           │
│             │ • Size      │ • RUM sorts │          │           │
│             │ • Text/OCR  │             │          │           │
│             │ • Crypto    │             │          │           │
└─────────────┴─────────────┴─────────────┴──────────┴───────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Cluster Manager  │
                    │  (Deduplication)  │
                    └───────────────────┘
```

---

## Core Capabilities

### 1. Crawlers (`crawler/`)

Crawlers fetch URLs from sitemaps and extract images from pages.

| Crawler | Description |
|---------|-------------|
| `SitemapCrawler` | Fetches URLs from an XML sitemap on the site |
| `FileSitemapCrawler` | Uses an uploaded sitemap file |
| `UrlSitemapCrawler` | Uses a sitemap from a different URL |

**Key Classes:**
- `AbstractCrawler` — Base class defining `fetchSitemap()` and `fetchBatch()` interfaces
- `AbstractEDSSitemapCrawler` — EDS-specific sitemap parsing and image extraction
- `CrawlerRegistry` — Auto-selects appropriate crawler based on form input

### 2. Identity System (`identity/`)

The identity system determines how images are identified and deduplicated.

#### Identity Types

| Identity | Purpose | Strong/Soft |
|----------|---------|-------------|
| `UrlIdentity` | Identifies by image URL | Strong |
| `UrlAndPageIdentity` | Tracks URL + page location + alt text | Soft |
| `SizeIdentity` | Identifies by dimensions | Soft |
| `ColorIdentity` | Extracts dominant colors (via ColorThief) | Soft, Singleton |
| `PerceptualIdentity` | Perceptual hash for visual similarity (via imagehash-web) | Soft |
| `CryptoIdentity` | Cryptographic hash of image data | Strong |
| `TextIdentity` | OCR text extraction (via Tesseract.js) | Soft |
| `LighthouseIdentity` | Lighthouse-style scoring | Soft, Singleton |

#### Identity Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                    Image Loading Pipeline                     │
├──────────────────────────────────────────────────────────────┤
│  1. identifyPreflight()    — Before image loads              │
│  2. identifyPostflight()   — After image loads               │
│  3. identifyPostflightWithCanvas() — After canvas available  │
│  4. identifyPostError()    — If image fails to load          │
└──────────────────────────────────────────────────────────────┘
```

#### Clustering & Deduplication

The `ClusterManager` groups images into clusters based on identity matches:

- **Strong identities** (e.g., URL hash) — Must be globally unique; matches trigger automatic merge
- **Soft identities** — Contribute to merge scoring; clusters merge when score ≥ 80
- **Similarity detection** — Marks images as similar when score ≥ 40

### 3. Sorting (`sort/`)

| Sort | Description |
|------|-------------|
| `Appearances` | Sort by number of times image appears |
| `Aspect` | Sort by aspect ratio |
| `LighthouseSort` | Sort by lighthouse performance score |
| **RUM Sorts** | Views, Visits, Conversions, Bounces, Performance |

### 4. Filtering (`filter/`)

| Filter | Description |
|--------|-------------|
| `Square` | Square aspect ratio (1:1) |
| `Portrait` | Portrait orientation (height > width) |
| `Landscape` | Landscape orientation (width > height) |
| `Widescreen` | Widescreen ratio (> 1.7:1) |
| `ColorFilter` | Filter by dominant color |
| `MissingAltText` | Images without alt text |

### 5. Reports (`reports/`)

| Report | Description |
|--------|-------------|
| `AuditReport` | Full audit CSV with all image data |
| `LighthouseReport` | Performance scoring report |

Reports are generated via `AbstractReport.generateReport(clusterManager)` and exported as CSV.

---

## External Dependencies

| Library | Purpose |
|---------|---------|
| [ColorThief](https://github.com/lokesh/color-thief) | Extract dominant colors from images |
| [imagehash-web](https://github.com/simon987/imagehash-web) | Perceptual hashing for visual similarity |
| [Tesseract.js](https://github.com/naptha/tesseract.js/) | OCR text extraction |
| [pixelmatch](https://github.com/mapbox/pixelmatch) | Pixel-level image comparison |
| [@adobe/rum-distiller](https://esm.sh/@adobe/rum-distiller) | RUM data integration |

---

## Utilities (`util/`)

| Utility | Purpose |
|---------|---------|
| `PromisePool` | Manages concurrent async operations with configurable limits |
| `ImageAuditUtil` | Helper functions for image analysis |
| `UrlResourceHandler` | Rate-limited fetch wrapper for resource loading |

---

## Data Flow

```
1. User submits form with site URL + options
              │
              ▼
2. CrawlerRegistry selects appropriate crawler
              │
              ▼
3. Crawler fetches sitemap → extracts page URLs
              │
              ▼
4. Pages fetched in batches → images extracted
              │
              ▼
5. For each image:
   ├─ Create IdentityCluster
   ├─ Run identity pipeline (preflight → postflight → canvas)
   ├─ ClusterManager merges matching clusters
   └─ Display in gallery (paginated)
              │
              ▼
6. User can sort, filter, and download reports
```

---

## Form Options

| Field | Description |
|-------|-------------|
| **Site URL** | Target site URL (supports sitemap.xml, EDS/AEM hlx/aem URLs, GitHub) |
| **Sitemap Replacement** | Use alternate sitemap (file or URL) |
| **RUM Domain Key** | Enable RUM data collection for performance metrics |
| **Identity Methods** | Select which identification methods to use |

---

## Storage

- **IndexedDB** (`ImageAuditExecutions`) — Persists form data per URL
- **localStorage** — Stores last executed URL for form restoration
- **Identity Cache** — Configurable cache providers (IndexedDB or localStorage)

---

## Extensibility

All major components use a registry pattern for easy extension:

```javascript
// Register a new identity type
IdentityRegistry.register(MyCustomIdentity);

// Register a new crawler
CrawlerRegistry.registerCrawler(MyCustomCrawler);

// Register a new report
ReportRegistry.register(MyCustomReport);

// Register a new sort
SortRegistry.registerSort(MyCustomSort);

// Register a new filter
FilterRegistry.registerFilter(MyCustomFilter);
```

---

## Key Files

| File | Purpose |
|------|---------|
| `scripts.js` | Main application entry point |
| `index.html` | UI structure |
| `styles.css` | Application styles |
| `identity/identityregistry.js` | Central identity registration |
| `identity/clustermanager.js` | Cluster management and deduplication |
| `crawler/crawlerregistry.js` | Crawler selection logic |
| `sort/sortregistry.js` | Sort registration |
| `filter/filterregistry.js` | Filter registration |
| `reports/reportregistry.js` | Report registration |

