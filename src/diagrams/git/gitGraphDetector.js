const detector = (txt) => {
  if (txt.match(/^\s*gitGraph/)) {
    return 'gitGraph';
  }
  return null;
};

export default detector;
