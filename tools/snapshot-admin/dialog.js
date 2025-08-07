// Snapshot Admin Dialog Component

const TEMPLATE = `
<div class="sa-dialog" role="dialog" aria-modal="true" style="display: none;">
  <div class="sa-dialog-overlay"></div>
  <div class="sa-dialog-content">
    <div class="sa-dialog-inner">
      <div class="sa-dialog-header-area">
        <p class="sa-dialog-heading"></p>
        <button
          class="sa-dialog-close-btn"
          aria-label="Close dialog">
          <svg class="icon" width="20" height="20" viewBox="0 0 20 20">
            <path d="M10 8.59L14.12 4.47L15.53 5.88L11.41 10L15.53 14.12L14.12 15.53L10 11.41L5.88 15.53L4.47 14.12L8.59 10L4.47 5.88L5.88 4.47L10 8.59Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <hr/>
      <div class="sa-dialog-content-area">
        <p class="sa-dialog-message"></p>
      </div>
      <div class="sa-dialog-action-group">
        <button class="sa-dialog-ok-btn">OK</button>
      </div>
    </div>
  </div>
</div>
`;

export default class SnapshotDialog {
  constructor() {
    this.details = null;
    this.onAction = null;
    this.element = null;
    this.dialogElement = null;
    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = 'sa-dialog-container';
    this.element.innerHTML = TEMPLATE;

    this.dialogElement = this.element.querySelector('.sa-dialog');
    this.setupEventListeners();
  }

  setupEventListeners() {
    const closeBtn = this.element.querySelector('.sa-dialog-close-btn');
    const okBtn = this.element.querySelector('.sa-dialog-ok-btn');
    const overlay = this.element.querySelector('.sa-dialog-overlay');

    closeBtn.addEventListener('click', () => this.handleAction());
    okBtn.addEventListener('click', () => this.handleAction());
    overlay.addEventListener('click', () => this.handleAction());

    // Handle ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.handleAction();
      }
    });
  }

  handleAction() {
    this.close();
    if (this.onAction) {
      this.onAction();
    }
  }

  show(details) {
    this.details = details;

    if (details) {
      const heading = this.element.querySelector('.sa-dialog-heading');
      const message = this.element.querySelector('.sa-dialog-message');

      heading.textContent = details.heading || '';
      message.textContent = details.message || '';

      this.dialogElement.style.display = 'block';
      document.body.style.overflow = 'hidden';

      // Focus management
      const closeBtn = this.element.querySelector('.sa-dialog-close-btn');
      closeBtn.focus();
    }
  }

  close() {
    this.dialogElement.style.display = 'none';
    document.body.style.overflow = '';
    this.details = null;
  }

  isOpen() {
    return this.dialogElement.style.display === 'block';
  }

  setActionHandler(handler) {
    this.onAction = handler;
  }
}
