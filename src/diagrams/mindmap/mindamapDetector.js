const detector = (txt) => {
  if (txt.match(/^\s*mindmap/)) {
    return 'mindmap';
  }
  return null;
};

export default detector;
