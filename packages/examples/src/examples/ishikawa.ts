import type { DiagramMetadata } from '../types.js';

export default {
  id: 'ishikawa',
  name: 'Ishikawa Diagram',
  description: 'Visualize cause-and-effect relationships using fishbone diagrams',
  examples: [
    {
      title: 'Basic Ishikawa Diagram',
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
      title: 'Manufacturing Quality Issues',
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
      title: 'Service Industry Problem Analysis',
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
      title: 'Different Node Shapes',
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
      title: 'Simple Problem Analysis',
      code: `ishikawa
problem "Project delays"
category "Resources"
  "Insufficient budget"
  "Limited staff"
  "Lack of expertise"`,
    },
  ],
} satisfies DiagramMetadata;
