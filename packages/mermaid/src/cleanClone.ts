/* eslint-disable @typescript-eslint/no-explicit-any */

export function removeUndefined(data: any): any {
  if (typeof data === 'object') {
    const entries: [string, any][] = Object.entries(data).filter(
      ([, value]: [string, any]) => value !== undefined
    );

    const clean: any[][] = entries.map(([key, v]: [string, any]) => {
      const value = typeof v == 'object' ? removeUndefined(v) : v;
      return [key, value];
    });

    return Object.fromEntries(clean);
  } else if (Array.isArray(data)) {
    return data.filter((value: any) => value !== undefined);
  }
  return data;
}

export function structuredCleanClone<T = any>(defaultData: T, data?: Partial<T>): T {
  const cleanValue: T = removeUndefined(data);
  return structuredClone<T>({ ...defaultData, ...cleanValue });
}
