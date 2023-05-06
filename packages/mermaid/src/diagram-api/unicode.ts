import { getSymbolFromCategories, Sm, So } from 'unicode-lookup';

export const replaceUnicodeTitlesWithVals = (diagram: string) =>
  diagram.replaceAll(/u:u-(([a-z-])+)/g, (_, title) =>
    getSymbolFromCategories(title.replaceAll('-', ' ').toUpperCase(), [So, Sm])
  );
