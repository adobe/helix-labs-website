import { createOptimizedPicture } from '../../scripts/aem.js';

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
  // ul.querySelectorAll('picture > img').forEach((img) => {
  //   const picture = img.closest('picture');
  //   const newPicture = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
  //   picture.replaceWith(newPicture);

  //   const newImg = newPicture.querySelector('img');
  //   newImg.setAttribute('height', img.getAttribute('height'));
  //   newImg.setAttribute('width', img.getAttribute('width'));
  // });
  ul.querySelectorAll(':scope > li a[href]:first-of-type').forEach((a) => {
    const li = a.closest('li');
    li.className = 'cards-card-linked';
    li.addEventListener('click', () => a.click());
  });
  block.textContent = '';
  block.append(ul);
}
