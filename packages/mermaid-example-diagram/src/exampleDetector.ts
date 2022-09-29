export const detector = (txt: string) => {
  return txt.match(/^\s*example-diagram/) !== null;
};
