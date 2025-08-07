# Snapshot Admin

This is a modern JavaScript implementation of the snapshot-admin functionality, created without external framework dependencies.

## Files

- `snapshot-admin.js` - Main component that manages the overall snapshot admin interface
- `snapshot.js` - Individual snapshot component handling CRUD operations 
- `dialog.js` - Modal dialog component for messages and confirmations
- `utils.js` - API utilities for interacting with AEM snapshot endpoints
- `snapshot-admin.css` - Comprehensive styling for all components

## Usage

### Basic Integration

```javascript
import init from './snapshot-admin.js';

// Initialize in a container element
const container = document.querySelector('.snapshot-admin-container');
init(container);
```

### URL Parameters

The snapshot admin supports automatic loading via URL parameters:

#### Snapshot URL Parameter
You can link directly to a specific snapshot using the `snapshot` parameter:

```
/tools/snapshot-admin/index.html?snapshot=https://main--demo--org.aem.page/.snapshots/name/.manifest.json
```

This will:
- Automatically parse the org, site, and snapshot name from the URL
- Set the site path and load all snapshots for that org/site
- Automatically expand the specified snapshot
- Scroll to the snapshot for easy viewing

#### Site Path Parameter
Alternatively, you can use the `sitePath` parameter for org/site combinations:

```
/tools/snapshot-admin/index.html?sitePath=org/site
```

### Features

- **Site Path Management**: Enter org/site path to fetch snapshots
- **Snapshot List**: View all snapshots for a site
- **Snapshot Creation**: Create new snapshots with custom names
- **Snapshot Editing**: 
  - Edit title, description, and password
  - Manage URLs (add/remove paths)
  - Lock/unlock snapshots
- **Review Workflow**:
  - Request review
  - Approve and publish
  - Reject and unlock
- **Content Operations**:
  - Sync content from main to snapshot
  - Promote content from snapshot to main
  - Share snapshot URLs

### Dependencies

This implementation has no external dependencies and works with modern browsers that support:
- ES6+ features (classes, modules, async/await)
- Fetch API
- CSS Grid and Flexbox

### API Integration

The component integrates with AEM Admin API endpoints:
- Fetches snapshots from `/snapshot/{org}/{site}/main`
- Creates/updates snapshots via POST requests
- Handles review workflows and content operations

### Styling

The CSS uses CSS custom properties (variables) for easy theming and is fully responsive with mobile-friendly breakpoints.

## Implementation Notes

This implementation maintains comprehensive snapshot management functionality including:
- Modern ES6+ JavaScript without external framework dependencies
- Responsive CSS styling with CSS custom properties
- Full API integration with AEM Admin endpoints
- Component-based architecture for maintainability

The API remains compatible with existing backend integrations.