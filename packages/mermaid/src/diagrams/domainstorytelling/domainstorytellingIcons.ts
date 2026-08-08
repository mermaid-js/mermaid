import type { IconifyJSON } from '@iconify/types';

/**
 * Built-in icon pack for Domain Storytelling, registered at module load like
 * the architecture diagram's `mermaid-architecture` pack. It covers the basic
 * Domain Storytelling notation (actors: person, people, system; work objects:
 * document, folder, call, email, conversation, info) so diagrams render real
 * icons out of the box — no `mermaid.registerIconPacks(...)` call required.
 *
 * All icons are hand-drawn originals (simple geometric line art). They use
 * `currentColor` strokes with no background shape, so they inherit the node
 * label's text color and follow the active theme.
 */
const lineIcon = (body: string) => ({
  body: `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</g>`,
});

export const domainstorytellingIcons: IconifyJSON = {
  prefix: 'mermaid-domainstorytelling',
  height: 24,
  width: 24,
  icons: {
    person: lineIcon(
      '<circle cx="12" cy="6.5" r="3.5"/><path d="M4.5 21v-.8a7.5 7.5 0 0 1 15 0v.8"/>'
    ),
    people: lineIcon(
      '<circle cx="9" cy="7" r="3"/><path d="M2.5 20.5v-.7a6.5 6.5 0 0 1 13 0v.7"/><path d="M15.5 4.3a3 3 0 0 1 0 5.4"/><path d="M17.6 13.8a6.5 6.5 0 0 1 3.9 5.9v.8"/>'
    ),
    system: lineIcon(
      '<rect x="3" y="4.5" width="18" height="11.5" rx="1.2"/><path d="M12 16v3.5"/><path d="M7.5 19.5h9"/>'
    ),
    document: lineIcon(
      '<path d="M14.5 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7z"/><path d="M14.5 3v4h4"/><path d="M9 12h6"/><path d="M9 16h6"/>'
    ),
    folder: lineIcon(
      '<path d="M3 6.5v-1A1.5 1.5 0 0 1 4.5 4h4l2 2.5h9A1.5 1.5 0 0 1 21 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>'
    ),
    call: lineIcon(
      '<path d="M8.6 4.2 9.9 7.3a1.5 1.5 0 0 1-.5 1.8L7.7 10.3a13.5 13.5 0 0 0 6 6l1.2-1.7a1.5 1.5 0 0 1 1.8-.5l3.1 1.3a1.5 1.5 0 0 1 .9 1.6l-.4 2.3a1.6 1.6 0 0 1-1.6 1.3C11.3 20.3 3.7 12.7 3.4 5.3A1.6 1.6 0 0 1 4.7 3.7L7 3.3a1.5 1.5 0 0 1 1.6.9z"/>'
    ),
    email: lineIcon(
      '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6.5 8.5 6 8.5-6"/>'
    ),
    conversation: lineIcon(
      '<path d="M21 14.5a1.5 1.5 0 0 1-1.5 1.5H9l-4.5 4v-4H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 4h15.5A1.5 1.5 0 0 1 21 5.5z"/>'
    ),
    info: lineIcon(
      '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><path d="M12 7.6h.01"/>'
    ),
  },
};
