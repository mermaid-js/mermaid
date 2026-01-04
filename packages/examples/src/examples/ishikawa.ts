import type { Example } from '../types.js';

export const ishikawaExamples: Example[] = [
  {
    name: 'Basic Ishikawa Diagram',
    description: 'A simple cause-and-effect diagram showing customer complaints with People, Process, and Equipment categories.',
    code: `ishikawa
problem "Customer complaints increasing"
category "People"
  "Lack of training"
  "Poor communication"
  "Inadequate supervision"
category "Process"
  "Inefficient workflow"
  "Missing procedures"
  "Poor documentation"
category "Equipment"
  "Outdated tools"
  "Maintenance issues"
  "Incompatible systems"`,
    isDefault: true,
  },
  {
    name: 'Manufacturing Quality Issues',
    description: 'A comprehensive fishbone diagram analyzing product quality issues using the 6M framework (Materials, Methods, Machines, Environment, Measurement, Manpower).',
    code: `ishikawa
problem "Product quality issues"
category "Materials"
  "Poor quality raw materials"
  "Inconsistent suppliers"
  "Storage problems"
category "Methods"
  "Outdated procedures"
  "Lack of standardization"
  "Poor work instructions"
category "Machines"
  "Equipment breakdowns"
  "Inadequate maintenance"
  "Calibration issues"
category "Environment"
  "Temperature fluctuations"
  "Humidity issues"
  "Poor lighting"
category "Measurement"
  "Inaccurate gauges"
  "Faulty testing equipment"
  "Inconsistent measurement methods"
category "Manpower"
  "Lack of training"
  "High turnover"
  "Fatigue"`,
  },
  {
    name: 'Service Industry Problem Analysis',
    description: 'An Ishikawa diagram for service industries using the 8P framework (Product, Price, Place, Promotion, People, Process, Physical Evidence, Performance).',
    code: `ishikawa
problem "Customer satisfaction declining"
category "Product/Service"
  "Quality issues"
  "Limited features"
  "Outdated offerings"
category "Price"
  "Too expensive"
  "Poor value perception"
  "Inconsistent pricing"
category "Place"
  "Inconvenient location"
  "Poor accessibility"
  "Limited availability"
category "Promotion"
  "Weak marketing"
  "Poor communication"
  "Lack of awareness"
category "People"
  "Unfriendly staff"
  "Lack of expertise"
  "Poor customer service"
category "Process"
  "Long wait times"
  "Complex procedures"
  "Inefficient operations"
category "Physical Evidence"
  "Poor facilities"
  "Outdated equipment"
  "Unprofessional appearance"
category "Performance"
  "Slow service"
  "Inconsistent delivery"
  "Quality problems"`,
  },
  {
    name: 'Different Node Shapes',
    description: 'Demonstrates various node shapes available in Ishikawa diagrams: square, rounded square, circle, cloud, and hexagon.',
    code: `ishikawa
problem "Test all shapes"
category "Shapes"
  "Default shape"
  [Square shape]
  (Rounded square)
  ((Circle shape))
  )Cloud shape(
  {{Hexagon shape}}`,
  },
  {
    name: 'Simple Problem Analysis',
    description: 'A minimal example with a single category and a few causes, perfect for getting started.',
    code: `ishikawa
problem "Project delays"
category "Resources"
  "Insufficient budget"
  "Limited staff"
  "Lack of expertise"`,
  },
];
