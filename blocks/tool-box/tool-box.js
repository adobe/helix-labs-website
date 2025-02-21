import { loadCSS, toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

async function loadTool(toolName, block) {
  const toolPath = `/tools/${toolName}`;

  try {
    const cssLoader = loadCSS(`${toolPath}/styles.css`);
    const fragmentLoader = (async () => {
      const fragment = await loadFragment(`${toolPath}/${toolName}.html`);
      block.replaceChildren(...fragment.childNodes);
      const mod = await import(`${toolPath}/scripts.js`);
      if (mod.default) {
        await mod.default();
      }
    })();

    await Promise.all([fragmentLoader, cssLoader]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`failed to load tool: ${toolName}`, e);
  }
}

export default async function decorate(block) {
  const toolName = toClassName(block.textContent.trim() || window.location.pathname.split('/').pop());

  await loadTool(toolName, block);
}
