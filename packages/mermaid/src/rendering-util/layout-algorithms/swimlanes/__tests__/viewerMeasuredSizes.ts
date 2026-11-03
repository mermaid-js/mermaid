import type { NodeSizes } from './viewerSizedLayout.js';

// What the dev viewer measures today, per swimlane fixture. The captured sizes files predate
// its larger node padding, and the layouts differ.

export const VIEWER_SIZES_13_DISAGREE_EXITS_B_C_D = {
  A: [150, 51],
  B: [204, 91],
  I: [152, 45],
  Sys1: [152, 45],
  E: [152, 45],
  C: [204, 91],
  D: [204, 91],
  F: [152, 45],
  G: [152, 45],
  H: [152, 45],
} as const satisfies NodeSizes;

export const VIEWER_SIZES_SALES_PROCESS = {
  C1: [187.02, 87],
  C2: [152, 45],
  Finished1: [171.23, 45],
  Finished2: [171.23, 45],
  S1: [171, 171],
  S2: [152, 87],
  T3: [152, 66],
  T5: [152, 66],
  T1: [171, 171],
  T2: [152, 45],
  T4: [152, 66],
  T6: [152, 45],
  Te1: [152, 45],
  Te2: [192, 192],
  D4: [171, 171],
  D1: [152, 45],
  D2: [152, 45],
  D3: [152, 45],
  'edge-label-S1-S2-L_S1_S2_0': [22.84, 21],
  'edge-label-S1-T1-L_S1_T1_0': [17.91, 21],
  'edge-label-T1-T2-L_T1_T2_0': [17.91, 21],
  'edge-label-T1-Te1-L_T1_Te1_0': [22.84, 21],
  'edge-label-Te2-D1-L_Te2_D1_0': [22.84, 21],
  'edge-label-Te2-T4-L_Te2_T4_0': [17.91, 21],
  'edge-label-T4-C2-L_T4_C2_0': [17.91, 21],
  'edge-label-D4-D2-L_D4_D2_0': [17.91, 21],
  'edge-label-D4-T6-L_D4_T6_0': [22.84, 21],
} as const satisfies NodeSizes;

export const VIEWER_SIZES_QUERY_PROCESS = {
  A: [150, 51],
  A2: [192, 192],
  E: [171, 171],
  F: [150, 51],
  G: [150, 51],
  F2: [150, 51],
  B: [171, 171],
  C: [150, 51],
} as const satisfies NodeSizes;

export const VIEWER_SIZES_8_QUERY_PROCESS_2 = {
  A: [150, 51],
  A2: [192, 192],
  E: [171, 171],
  F: [150, 51],
  G: [150, 51],
  F2: [150, 51],
  B: [171, 171],
  C: [150, 51],
} as const satisfies NodeSizes;
