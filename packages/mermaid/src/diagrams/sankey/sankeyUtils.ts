export const prepareTextForParsing = (text: string): string => {
  const records: string[] = [];
  let recordStart = 0;
  let inQuotes = false;

  for (let i = 0; i <= text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        // An escaped quote does not end the quoted field.
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (i === text.length || (!inQuotes && (char === '\n' || char === '\r'))) {
      // Only trim complete records: line edges inside quoted fields are data.
      const record = text.slice(recordStart, i).trim();
      if (record) {
        records.push(record);
      }
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      recordStart = i + 1;
    }
  }

  return records.join('\n');
};
