import type { IconifyJSON } from '@iconify/types';

export const c4Icons: IconifyJSON = {
  prefix: 'mermaid-c4',
  height: 80,
  width: 80,
  icons: {
    database: {
      body: '<path id="b" data-name="4" d="m20,57.86c0,3.94,8.95,7.14,20,7.14s20-3.2,20-7.14" style="fill: none; stroke-miterlimit: 10; stroke-width: 4px;"/><path id="c" data-name="3" d="m20,45.95c0,3.94,8.95,7.14,20,7.14s20-3.2,20-7.14" style="fill: none; stroke-miterlimit: 10; stroke-width: 4px;"/><path id="d" data-name="2" d="m20,34.05c0,3.94,8.95,7.14,20,7.14s20-3.2,20-7.14" style="fill: none; stroke-miterlimit: 10; stroke-width: 4px;"/><ellipse id="e" data-name="1" cx="40" cy="22.14" rx="20" ry="7.14" style="fill: none; stroke-miterlimit: 10; stroke-width: 4px;"/><line x1="20" y1="57.86" x2="20" y2="22.14" style="fill: none; stroke-miterlimit: 10; stroke-width: 4px;"/><line x1="60" y1="57.86" x2="60" y2="22.14" style="fill: none; stroke-miterlimit: 10; stroke-width: 4px;"/>',
    },
    person: {
      body: '<path d="M20 19.9993C18.1666 19.9993 16.5972 19.3466 15.2916 18.041C13.9861 16.7355 13.3333 15.166 13.3333 13.3327C13.3333 11.4993 13.9861 9.9299 15.2916 8.62435C16.5972 7.31879 18.1666 6.66602 20 6.66602C21.8333 6.66602 23.4027 7.31879 24.7083 8.62435C26.0138 9.9299 26.6666 11.4993 26.6666 13.3327C26.6666 15.166 26.0138 16.7355 24.7083 18.041C23.4027 19.3466 21.8333 19.9993 20 19.9993ZM6.66663 33.3327V28.666C6.66663 27.7216 6.90968 26.8535 7.39579 26.0618C7.8819 25.2702 8.52774 24.666 9.33329 24.2493C11.0555 23.3882 12.8055 22.7424 14.5833 22.3118C16.3611 21.8813 18.1666 21.666 20 21.666C21.8333 21.666 23.6388 21.8813 25.4166 22.3118C27.1944 22.7424 28.9444 23.3882 30.6666 24.2493C31.4722 24.666 32.118 25.2702 32.6041 26.0618C33.0902 26.8535 33.3333 27.7216 33.3333 28.666V33.3327H6.66663ZM9.99996 29.9993H30V28.666C30 28.3605 29.9236 28.0827 29.7708 27.8327C29.618 27.5827 29.4166 27.3882 29.1666 27.2493C27.6666 26.4993 26.1527 25.9368 24.625 25.5618C23.0972 25.1868 21.5555 24.9993 20 24.9993C18.4444 24.9993 16.9027 25.1868 15.375 25.5618C13.8472 25.9368 12.3333 26.4993 10.8333 27.2493C10.5833 27.3882 10.3819 27.5827 10.2291 27.8327C10.0763 28.0827 9.99996 28.3605 9.99996 28.666V29.9993ZM20 16.666C20.9166 16.666 21.7013 16.3396 22.3541 15.6868C23.0069 15.0341 23.3333 14.2493 23.3333 13.3327C23.3333 12.416 23.0069 11.6313 22.3541 10.9785C21.7013 10.3257 20.9166 9.99935 20 9.99935C19.0833 9.99935 18.2986 10.3257 17.6458 10.9785C16.993 11.6313 16.6666 12.416 16.6666 13.3327C16.6666 14.2493 16.993 15.0341 17.6458 15.6868C18.2986 16.3396 19.0833 16.666 20 16.666Z" fill="#28253D"/>',
    },
    unknown: {
      body: '<g><text transform="translate(21.16 64.67)" style="font-family: ArialMT, Arial; font-size: 67.75px;"><tspan x="0" y="0">?</tspan></text></g>',
    },
  },
};

export function getIconDimensions(iconName: string): {
  height: number;
  width: number;
  viewBox: number;
} {
  switch (iconName) {
    case 'database':
      return { height: 50, width: 50, viewBox: 80 };
    case 'person':
      return { height: 40, width: 40, viewBox: 40 };
    case 'unknown':
      return { height: 40, width: 40, viewBox: 80 };
    default:
      return { height: 80, width: 80, viewBox: 80 };
  }
}
