export interface C4StyleOptions {
  personBorder: string;
  personBkg: string;
}

const getStyles = (options: C4StyleOptions) =>
  `.person {
    stroke: ${options.personBorder};
    fill: ${options.personBkg};
  }
`;

export default getStyles;
