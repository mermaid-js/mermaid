import type { DiagramMetadata } from '../types.js';

export default {
  id: 'venn',
  name: 'Venn Diagram',
  description: 'Represent relationships in overlapping circles',
  examples: [
    {
      title: 'Product Sweet Spot',
      isDefault: true,
      code: `venn-beta
    title "Finding the Product Sweet Spot"
    set Desirable
    set Feasible
    set Viable
    union Desirable,Feasible["Worth prototyping"]
    union Feasible,Viable["Cheap to run"]
    union Desirable,Viable["Hard to build"]
    union Desirable,Feasible,Viable["Sweet spot"]`,
    },
    {
      title: 'Team Skill Overlap with Sizes and Styles',
      code: `venn-beta
    title "Where our teams overlap"
    set FE["Frontend"]:18
        text fe1["React"]
        text fe2["CSS"]
    set BE["Backend"]:22
        text be1["Databases"]
        text be2["APIs"]
    union FE,BE["Full-stack"]:8
        text fs1["TypeScript"]
    style FE fill:skyblue
    style BE fill:lightgreen`,
    },
  ],
} satisfies DiagramMetadata;
