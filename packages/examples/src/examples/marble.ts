import type { DiagramMetadata } from '../types.js';

export default {
  id: 'marbleDiagram',
  name: 'Marble Diagram',
  description: 'RxJS-style timelines of events, spans, cancellations and completions',
  examples: [
    {
      title: 'debounceTime',
      isDefault: true,
      code: `marble-beta
  title debounceTime(3)
  axis   : 0    5    10   15
  input  : -a-b-c-----d---|
  output : --------c-----d|
  label c "emitted"
`,
    },
    {
      title: 'switchMap',
      code: `marble-beta
  title switchMap: a new search cancels the one in flight
  axis       : 0    5    10   15
  input      : -a-----b--c--------|
  "search a" :  [=====x
  "search b" :        [==x
  "search c" :           [=====]
  output     : ----------------r--|
  label = "request"
  label x "cancelled"
  label r "results for c"
`,
    },
    {
      title: 'timeout and retry',
      code: `marble-beta
  title timeout(5) then retry once after 1h
  axis    : 0    5    /  1h
  request : -[====x---/--[====#
  result  : ----------/-------#
  label = "attempt"
  label x "timed out"
  label # "TimeoutError"
`,
    },
  ],
} satisfies DiagramMetadata;
