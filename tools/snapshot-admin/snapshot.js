import SnapshotDialog from './dialog.js';
import {
  deleteSnapshot,
  fetchManifest,
  saveManifest,
  copyManifest,
  updatePaths,
  reviewSnapshot,
} from './utils.js';

export default class SnapshotComponent {
  constructor(basics = {}) {
    this.basics = basics;
    this.manifest = null;
    this.editUrls = false;
    this.message = null;
    this.action = null;
    this.onDelete = null;

    this.element = null;
    this.dialog = new SnapshotDialog();
    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = 'sa-snapshot-item';
    this.render();
    this.setupEventListeners();

    // Add dialog to document if not already added
    if (!document.querySelector('.sa-dialog-container')) {
      document.body.appendChild(this.dialog.element);
    }

    this.dialog.setActionHandler(() => {
      this.message = null;
      this.render();
    });

    if (this.basics.name && !this.manifest) {
      this.loadManifest();
    }
  }

  async loadManifest() {
    this.manifest = await fetchManifest(this.basics.name);
    this.render();
  }

  setupEventListeners() {
    // Event delegation for dynamic content
    this.element.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const { action } = target.dataset;
      const { param } = target.dataset;

      switch (action) {
        case 'expand':
          this.handleExpand();
          break;
        case 'save':
          this.handleSave(param === 'true' || param === 'false' ? param : undefined);
          break;
        case 'delete':
          this.handleDelete();
          break;
        case 'lock':
          this.handleLock();
          break;
        case 'review':
          this.handleReview(param);
          break;
        case 'copy':
          this.handleCopyUrls(param);
          break;
        case 'share':
          this.handleShare();
          break;
        case 'edit-urls':
          this.handleUrls();
          break;
        case 'cancel-urls':
          this.handleUrls();
          break;
        default:
          break;
      }
    });

    // Handle form submissions
    this.element.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  }

  handleExpand() {
    // Do not allow closing if there is no name
    if (this.basics.open && !this.basics.name) return;

    this.basics.open = !this.basics.open;
    this.render();
  }

  handleUrls() {
    this.editUrls = !this.editUrls;
    this.render();
  }

  async handleEditUrls() {
    const textUrls = this.getValue('[name="edit-urls"]');
    if (textUrls) {
      const currPaths = this.manifest?.resources?.map((res) => res.path) || [];
      const editedHrefs = textUrls?.split('\n') || [];
      const result = await updatePaths(this.basics.name, currPaths, editedHrefs);
      if (result.error) {
        this.showMessage('Note', result.error);
      }
    }
  }

  async handleSave(lock) {
    this.setAction('Saving');
    const name = this.basics.name || this.getValue('[name="name"]');

    // Set the name if it isn't already set
    if (!this.basics.name) this.basics.name = name;

    const manifest = this.getUpdatedManifest();

    // Handle any URLs which may have changed
    await this.handleEditUrls();

    // Set the lock status if it's not undefined
    if (lock === true || lock === false) manifest.locked = lock;

    const result = await saveManifest(name, manifest);
    this.setAction(null);
    this.editUrls = false;

    if (result.error) {
      this.showMessage('Note', result.error);
      return;
    }
    this.manifest = result;
    this.render();
  }

  handleLock() {
    if (!this.manifest.locked) {
      this.handleReview('request');
      return;
    }
    this.handleSave(false);
  }

  handleShare() {
    const aemPaths = this.manifest.resources.map((res) => res.aemPreview);
    const text = aemPaths.join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showMessage('Copied', 'URLs copied to clipboard.');
      }).catch(() => {
        this.fallbackCopyToClipboard(text);
      });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.showMessage('Copied', 'URLs copied to clipboard.');
    } catch (err) {
      this.showMessage('Error', 'Could not copy URLs to clipboard.');
    }
    document.body.removeChild(textArea);
  }

  async handleDelete() {
    const result = await deleteSnapshot(this.basics.name);
    if (result.error) {
      this.showMessage('Note', result.error);
      return;
    }

    if (this.onDelete) {
      this.onDelete();
    }
  }

  async handleReview(state) {
    this.setAction('Saving');
    const result = await reviewSnapshot(this.basics.name, state);
    this.setAction(null);

    if (result.error) {
      this.showMessage('Note', result.error);
      return;
    }
    this.loadManifest();
  }

  async handleCopyUrls(direction) {
    this.setAction(direction === 'fork'
      ? 'Forking content into snapshot.'
      : 'Promoting content from snapshot.');
    await copyManifest(this.basics.name, this.manifest.resources, direction);
    this.setAction(null);
  }

  getValue(selector) {
    const element = this.element.querySelector(selector);
    const value = element?.value;
    return value === '' ? undefined : value;
  }

  getUpdatedManifest() {
    return {
      title: this.getValue('[name="title"]'),
      description: this.getValue('[name="description"]'),
      metadata: { reviewPassword: this.getValue('[name="password"]') },
    };
  }

  get lockStatus() {
    if (!this.manifest?.locked) return { text: 'Unlocked', icon: 'unlock' };
    return { text: 'Locked', icon: 'lock' };
  }

  get reviewStatus() {
    if (this.manifest?.review === 'requested' && this.manifest?.locked) return 'Ready';
    if (this.manifest?.review === 'rejected') return 'Rejected';
    return undefined;
  }

  setAction(action) {
    this.action = action;
    this.render();
  }

  showMessage(heading, message) {
    this.message = { heading, message, open: true };
    this.dialog.show(this.message);
  }

  renderUrls() {
    if (!this.manifest?.resources) return '';

    return `
      <ul class="sa-snapshot-urls">
        ${this.manifest.resources.map((res) => `
          <li>
            <a href="${res.url}" target="_blank">
              <span>${res.path}</span>
              <div class="icon-wrap">
                <svg class="icon" width="20" height="20" viewBox="0 0 20 20">
                  <path d="M14 3V5H16.5L10.5 11L11.91 12.41L18 6.41V9H20V3M4 3C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H16C17.1 19 18 18.1 18 17V12H16V17H4V5H9V3H4Z" fill="currentColor"/>
                </svg>
              </div>
            </a>
          </li>
        `).join('')}
      </ul>
    `;
  }

  renderEditUrls() {
    const resources = this.manifest?.resources || [];
    const newLinedRes = resources.map((res) => res.aemPreview).join('\n');

    return `
      <textarea
        name="edit-urls"
        class="sa-snapshot-edit-urls"
        rows="20">${newLinedRes}</textarea>
    `;
  }

  renderDetails() {
    const showEdit = !this.manifest?.resources || this.editUrls;
    const count = this.manifest?.resources?.length || 0;
    const s = count === 1 ? '' : 's';

    return `
      <div class="sa-snapshot-details">
        <div class="sa-snapshot-details-left ${showEdit ? '' : 'is-list'}">
          <div class="sa-snapshot-sub-heading sa-snapshot-sub-heading-urls">
            <p>
              ${showEdit ? 'URLs' : `${count} URL${s}`}
              <button data-action="${showEdit ? 'cancel-urls' : 'edit-urls'}" 
                      ${this.manifest?.locked && !showEdit ? 'disabled' : ''}
                      title="${this.manifest?.locked ? 'Unlock snapshot to edit URLs.' : ''}">
                ${showEdit ? 'Cancel' : 'Edit'}
              </button>
              ${!showEdit ? '<button data-action="share">Share</button>' : ''}
            </p>
            ${!showEdit ? `
              <div class="sa-snapshot-sub-heading-actions">
                <p>Sources:</p>
                <button data-action="copy" data-param="fork">Sync</button>
                <p>|</p>
                <button data-action="copy" data-param="promote">Promote</button>
              </div>
            ` : ''}
          </div>
          ${showEdit ? this.renderEditUrls() : this.renderUrls()}
        </div>
        <div class="sa-snapshot-details-right">
          <div class="sa-snapshot-meta">
            <p class="sa-snapshot-sub-heading">Title</p>
            <input type="text" name="title" value="${this.manifest?.title || ''}" />
            <p class="sa-snapshot-sub-heading">Description</p>
            <textarea name="description" rows="4">${this.manifest?.description || ''}</textarea>
            <p class="sa-snapshot-sub-heading">Password</p>
            <input type="password" name="password" value="${this.manifest?.metadata?.reviewPassword || ''}" />
          </div>
          <div class="sa-snapshot-actions">
            <p class="sa-snapshot-sub-heading">Snapshot</p>
            <div class="sa-snapshot-action-group">
              <button data-action="delete" ${this.manifest?.locked ? 'disabled' : ''}>
                <svg class="icon" width="20" height="20" viewBox="0 0 20 20">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" fill="currentColor"/>
                </svg>
                Delete
              </button>
              <button data-action="lock">
                <svg class="icon" width="20" height="20" viewBox="0 0 20 20">
                  ${this.lockStatus.icon === 'lock'
    ? '<path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z" fill="currentColor"/>'
    : '<path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10A2,2 0 0,1 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17Z" fill="currentColor"/>'
}
                </svg>
                ${this.lockStatus.text}
              </button>
              <button data-action="save" class="${showEdit ? 'is-editing' : ''}">
                <svg class="icon" width="20" height="20" viewBox="0 0 20 20">
                  <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" fill="currentColor"/>
                </svg>
                Save
              </button>
            </div>
            <p class="sa-snapshot-sub-heading">Review</p>
            <div class="sa-snapshot-action-group">
              <button data-action="review" data-param="request" ${this.manifest?.locked ? 'disabled' : ''}>
                <svg class="icon" width="20" height="20" viewBox="0 0 20 20">
                  <path d="M19,3H5C3.9,3 3,3.9 3,5V9H5V5H19V19H5V15H3V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.9 20.1,3 19,3Z" fill="currentColor"/>
                </svg>
                Request<br/>review
              </button>
              <button data-action="review" data-param="reject" ${!this.manifest?.locked ? 'disabled' : ''}>
                <svg class="icon" width="20" height="20" viewBox="0 0 20 20">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M14.5,9L12,11.5L9.5,9L8,10.5L10.5,13L8,15.5L9.5,17L12,14.5L14.5,17L16,15.5L13.5,13L16,10.5L14.5,9Z" fill="currentColor"/>
                </svg>
                Reject<br/>& unlock
              </button>
              <button data-action="review" data-param="approve" ${!this.manifest?.locked ? 'disabled' : ''}>
                <svg class="icon" width="20" height="20" viewBox="0 0 20 20">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" fill="currentColor"/>
                </svg>
                Approve<br/>& publish
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const isOpen = this.basics.open;
    const isNew = !this.basics.name;
    const { reviewStatus } = this;

    this.element.innerHTML = `
      <div class="sa-snapshot-wrapper ${isOpen ? 'is-open' : ''} ${this.action ? 'is-saving' : ''}" 
           data-action="${this.action || ''}">
        <div class="sa-snapshot-header" data-action="expand">
          ${isNew ? `
            <input type="text" name="name" placeholder="Enter snapshot name" />
          ` : `
            <div class="sa-snapshot-header-title">
              <p>${this.basics.name}</p>
              ${reviewStatus ? `<p>${reviewStatus}</p>` : ''}
            </div>
          `}
          <button class="sa-snapshot-expand" data-action="expand">Expand</button>
        </div>
        ${isOpen ? this.renderDetails() : ''}
      </div>
    `;
  }

  setDeleteHandler(handler) {
    this.onDelete = handler;
  }
}
