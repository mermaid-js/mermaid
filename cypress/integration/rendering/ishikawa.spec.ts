import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('Ishikawa diagram', () => {
  it('should render a simple Ishikawa diagram with problem and categories', () => {
    imgSnapshotTest(
      `ishikawa
problem "Customer complaints increasing"
category "People"
  "Lack of training"
  "Poor communication"
category "Process"
  "Inefficient workflow"
  "Missing procedures"
      `
    );
  });

  it('should render an Ishikawa diagram with multiple categories', () => {
    imgSnapshotTest(
      `ishikawa
problem "Product quality issues"
category "Materials"
  "Poor quality raw materials"
  "Inconsistent suppliers"
  "Storage problems"
category "Methods"
  "Outdated procedures"
  "Lack of standardization"
category "Machines"
  "Equipment breakdowns"
  "Inadequate maintenance"
category "Environment"
  "Temperature fluctuations"
  "Humidity issues"
      `
    );
  });

  it('should render an Ishikawa diagram with square shapes', () => {
    imgSnapshotTest(
      `ishikawa
problem "Quality issues"
category "Materials"
  [Poor quality raw materials]
  [Inconsistent suppliers]
category "Methods"
  [Outdated procedures]
      `
    );
  });

  it('should render an Ishikawa diagram with rounded square shapes', () => {
    imgSnapshotTest(
      `ishikawa
problem "Service delivery delays"
category "People"
  (Staff shortages)
  (Poor training)
category "Process"
  (Complex procedures)
      `
    );
  });

  it('should render an Ishikawa diagram with circle shapes', () => {
    imgSnapshotTest(
      `ishikawa
problem "Quality issues"
category "Materials"
  ((Poor quality raw materials))
  ((Inconsistent suppliers))
      `
    );
  });

  it('should render an Ishikawa diagram with cloud shapes', () => {
    imgSnapshotTest(
      `ishikawa
problem "Quality issues"
category "Materials"
  )Poor quality raw materials(
  )Storage problems(
      `
    );
  });

  it('should render an Ishikawa diagram with hexagon shapes', () => {
    imgSnapshotTest(
      `ishikawa
problem "Quality issues"
category "Materials"
  {{Poor quality raw materials}}
  {{Inconsistent suppliers}}
      `
    );
  });

  it('should render an Ishikawa diagram with mixed shapes', () => {
    imgSnapshotTest(
      `ishikawa
problem "Service delivery delays"
category "People"
  [Staff shortages]
  (Poor training)
  ((High turnover))
category "Process"
  [Complex procedures]
  (Inefficient workflow)
  ((Lack of automation))
      `
    );
  });

  it('should render a manufacturing Ishikawa diagram with 6M categories', () => {
    imgSnapshotTest(
      `ishikawa
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
  "Poor measurement techniques"
category "Manpower"
  "Lack of training"
  "Fatigue"
  "Poor motivation"
      `
    );
  });

  it('should render an Ishikawa diagram when useMaxWidth is true (default)', () => {
    renderGraph(
      `ishikawa
problem "Software bugs in production"
category "People"
  "Lack of testing experience"
  "Poor code reviews"
category "Process"
  "Inadequate testing procedures"
  "Missing deployment checks"
      `,
      { ishikawa: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).to.be.greaterThan(0);
    });
  });

  it('should render an Ishikawa diagram when useMaxWidth is false', () => {
    imgSnapshotTest(
      `ishikawa
problem "Software bugs in production"
category "People"
  "Lack of testing experience"
  "Poor code reviews"
category "Process"
  "Inadequate testing procedures"
  "Missing deployment checks"
      `,
      { ishikawa: { useMaxWidth: false } }
    );
  });

  it('should render an Ishikawa diagram with many causes per category', () => {
    imgSnapshotTest(
      `ishikawa
problem "Customer satisfaction declining"
category "Product"
  "Defective products"
  "Late delivery"
  "Wrong items shipped"
  "Poor packaging"
  "Missing instructions"
category "Service"
  "Slow response times"
  "Unhelpful staff"
  "Long wait times"
  "Poor communication"
  "No follow-up"
category "Pricing"
  "Prices too high"
  "Hidden fees"
  "No discounts available"
  "Payment issues"
      `
    );
  });

  it('should render an Ishikawa diagram with single category', () => {
    imgSnapshotTest(
      `ishikawa
problem "Website performance issues"
category "Technical"
  "Slow server response"
  "Large image files"
  "Excessive JavaScript"
  "No caching"
      `
    );
  });

  it('should render an Ishikawa diagram with long problem statement', () => {
    imgSnapshotTest(
      `ishikawa
problem "Why are customers experiencing delays in receiving their orders and complaining about the quality of products?"
category "Logistics"
  "Shipping delays"
  "Warehouse inefficiencies"
category "Quality Control"
  "Insufficient inspections"
  "Poor supplier management"
      `
    );
  });

  it('should render an Ishikawa diagram with long cause names', () => {
    imgSnapshotTest(
      `ishikawa
problem "Project delays"
category "People"
  "Team members lack sufficient training in the new technology stack being used for this project"
  "Inadequate communication between remote team members across different time zones"
category "Resources"
  "Insufficient budget allocation for critical project components and third-party services"
      `
    );
  });
});
