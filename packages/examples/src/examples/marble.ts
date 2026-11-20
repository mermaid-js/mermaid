import type { DiagramMetadata } from '../types.js';

export default {
  id: 'marbleDiagram',
  name: 'Marble Diagram',
  description:
    'RxJS-style timelines in RxJS marble syntax: events, groups, subscriptions, spans and completions',
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
  "search a" :  [=====!
  "search b" :        [==!
  "search c" :           [=====]
  output     : ----------------r--|
  label = "request"
  label ! "cancelled"
  label r "results for c"
`,
    },
    {
      title: 'timeout and retry',
      code: `marble-beta
  title timeout(5) then retry once after 1h
  axis    : 0    5    /  1h
  request : -[====!---/--[====#
  result  : ----------/-------#
  label = "attempt"
  label ! "timed out"
  label # "TimeoutError"
`,
    },
    {
      title: 'RxJS syntax',
      code: `marble-beta
  title Two subscribers to a hot source
  source : --a--a--a--a--a--a--a--
  sub1   : --^-----------!
  sub2   : ---------^--------!
  first  : --a--a--a--a--
  second : -----------a--a--a-
  label ^ "subscribed"
  label ! "unsubscribed"
`,
    },
  ],
} satisfies DiagramMetadata;
