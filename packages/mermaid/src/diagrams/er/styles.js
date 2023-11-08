const getStyles = (options) => {
  const defaultOptions = {
    mainBkg: 'white',
    nodeBorder: 'black',
    attributeBackgroundColorOdd: 'lightgray',
    attributeBackgroundColorEven: 'white',
    tertiaryColor: 'gray',
    lineColor: 'black',
    textColor: 'black',
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return `
    .entityBox {
      fill: ${mergedOptions.mainBkg};
      stroke: ${mergedOptions.nodeBorder};
    }

    .attributeBoxOdd {
      fill: ${mergedOptions.attributeBackgroundColorOdd};
      stroke: ${mergedOptions.nodeBorder};
    }

    .attributeBoxEven {
      fill: ${mergedOptions.attributeBackgroundColorEven};
      stroke: ${mergedOptions.nodeBorder};
    }

    .relationshipLabelBox {
      fill: ${mergedOptions.tertiaryColor};
      opacity: 0.7;
      background-color: ${mergedOptions.tertiaryColor};
      rect {
        opacity: 0.5;
      }
    }

    .relationshipLine {
      stroke: ${mergedOptions.lineColor};
    }

    .entityTitleText {
      text-anchor: middle;
      font-size: 18px;
      fill: ${mergedOptions.textColor};
    }    
    
    #MD_PARENT_START {
      fill: #f5f5f5 !important;
      stroke: ${mergedOptions.lineColor} !important;
      stroke-width: 1;
    }
    #MD_PARENT_END {
      fill: #f5f5f5 !important;
      stroke: ${mergedOptions.lineColor} !important;
      stroke-width: 1;
    }
  `;
};

export default getStyles;
