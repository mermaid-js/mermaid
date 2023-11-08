const getStyles = (options) => {
  const defaultOptions = {
    personBorder: 'black',
    personBkg: 'white',
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return `
    .person {
      stroke: ${mergedOptions.personBorder};
      fill: ${mergedOptions.personBkg};
    }
  `;
};

export default getStyles;
