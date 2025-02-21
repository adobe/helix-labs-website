import {
  buildBlock, decorateBlock, loadBlock, loadCSS, toClassName,
} from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

async function loadTool(toolName, block) {
  const toolPath = `/tools/${toolName}`;

  try {
    const cssLoader = loadCSS(`${toolPath}/styles.css`);
    const fragmentLoader = (async () => {
      const fragment = await loadFragment(`${toolPath}/${toolName}.html`);
      block.replaceChildren(...fragment.childNodes);

      const toolFormConfig = block.querySelector('form .config-field');
      if (toolFormConfig) {
        const cfgField = buildBlock('tool-config', '');
        toolFormConfig.replaceWith(cfgField);
        decorateBlock(cfgField);
        await loadBlock(cfgField);
      }

      const mod = await import(`${toolPath}/scripts.js`);
      if (mod.default) {
        await mod.default(document);
      }
    })();

    await Promise.all([fragmentLoader, cssLoader]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`failed to load tool: ${toolName}`, e);
  }
}

export default async function decorate(block) {
  let toolName = block.textContent.trim();
  if (!toolName) {
    const pathSegs = window.location.pathname.split('/');
    toolName = pathSegs.pop();
    if (toolName === '' || toolName === 'index.html') {
      toolName = pathSegs.pop();
    }
  }
  toolName = toClassName(toolName);

  await loadTool(toolName, block);
}
