export default function decorate(block) {
  // convert cards to list and list items
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.append(...row.children);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  // decorate card content
  ul.querySelectorAll('picture > img, picture > source').forEach((source) => {
    const attrName = source.tagName === 'IMG' ? 'src' : 'srcset';
    const src = source.getAttribute(attrName);
    const srcUrl = new URL(src, window.location);
    const params = new URLSearchParams(srcUrl.search);
    params.set('width', '750');
    if (source.hasAttribute('media')) {
      params.set('optimize', 'high');
    }
    srcUrl.search = params.toString();
    source.setAttribute(attrName, srcUrl.href);
  });
  ul.querySelectorAll(':scope > li a[href]:first-of-type').forEach((a) => {
    const li = a.closest('li');
    li.className = 'cards-card-linked';
    li.addEventListener('click', () => a.click());
  });
  block.textContent = '';
  block.append(ul);
}
