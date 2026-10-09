import { getConfig } from '../../../diagram-api/diagramAPI.js';
import defaultConfig from '../../../defaultConfig.js';
import { parseFontSize } from '../../../utils.js';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/**
 * Waits for all images in a container to load and applies appropriate styling.
 * This ensures accurate bounding box measurements after images are loaded.
 *
 * @param container - The HTML element containing img tags
 * @returns Promise that resolves when all images are loaded and styled
 */
export async function configureLabelImages(container: HTMLElement): Promise<void> {
  const images = container.getElementsByTagName('img');
  if (!images || images.length === 0) {
    return;
  }

  const noImgText = !hasTextBesidesImages(container);

  await Promise.all(
    [...images].map(
      (img) =>
        new Promise((res) => {
          function setupImage() {
            img.style.display = 'flex';
            img.style.flexDirection = 'column';

            if (noImgText) {
              // default size if no text
              const bodyFontSize = getConfig().fontSize
                ? getConfig().fontSize
                : window.getComputedStyle(document.body).fontSize;
              const enlargingFactor = 5;
              const [parsedBodyFontSize = defaultConfig.fontSize] = parseFontSize(bodyFontSize);
              const width = parsedBodyFontSize * enlargingFactor + 'px';
              img.style.minWidth = width;
              img.style.maxWidth = width;
            } else {
              img.style.width = '100%';
            }
            res(img);
          }
          setTimeout(() => {
            if (img.complete) {
              setupImage();
            }
          });
          img.addEventListener('error', setupImage);
          img.addEventListener('load', setupImage);
        })
    )
  );
}

export function hasTextBesidesImages(node: Node): boolean {
  if (node.nodeType === TEXT_NODE) {
    return node.textContent?.trim() !== '';
  }

  if (node.nodeType !== ELEMENT_NODE) {
    return false;
  }

  const element = node as Element;
  if (element.tagName.toLowerCase() === 'img') {
    return false;
  }

  return [...node.childNodes].some(hasTextBesidesImages);
}
