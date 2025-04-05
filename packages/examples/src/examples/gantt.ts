import type { DiagramMetadata } from '../types.js';

export default {
  id: 'gantt',
  name: 'Gantt Chart',
  description: 'Visualize project schedules and timelines',
  examples: [
    {
      isDefault: true,
      code: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`,
      title: 'Basic Project Timeline',
    },
  ],
} satisfies DiagramMetadata;
