/** The version that the `info` diagram's db reports, with a `-tiny` suffix in tiny. */
export const version = injected.version + (injected.includeLargeFeatures ? '' : '-tiny');
