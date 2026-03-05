import { getConfig } from '../../../diagram-api/diagramAPI.js';
import defaultConfig from '../../../defaultConfig.js';
import { parseFontSize } from '../../../utils.js';

/**
 * Waits for all images in a container to load and applies appropriate styling.
 * This ensures accurate bounding box measurements after images are loaded.
 *
 * @param container - The HTML element containing img tags
 * @param labelText - The original label text to check if there's text besides images
 * @returns Promise that resolves when all images are loaded and styled
 */
export async function configureLabelImages(
  container: HTMLElement,
  labelText: string
): Promise<void> {
  const images = container.getElementsByTagName('img');
  if (!images || images.length === 0) {
    return;
  }

  const noImgText = labelText.replace(/<img[^>]*>/g, '').trim() === '';

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
