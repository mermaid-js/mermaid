// https://stackoverflow.com/a/35373030/3469145
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

const getTextWidth = (text) => context.measureText(text).width * window.devicePixelRatio;

export { getTextWidth };
