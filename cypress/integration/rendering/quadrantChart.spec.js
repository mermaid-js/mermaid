import { imgSnapshotTest, renderGraph } from '../../helpers/util.js';

describe('Quadrant Chart', () => {
  it('should render if only chart type is provided', () => {
    imgSnapshotTest(
      `
  quadrantChart
      `,
      {}
    );
    cy.get('svg');
  });
  it('should render a complete quadrant chart', () => {
    imgSnapshotTest(
      `
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]
      `,
      {}
    );
    cy.get('svg');
  });
  it('should render without points', () => {
    imgSnapshotTest(
      `
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
      `,
      {}
    );
    cy.get('svg');
  });
  it('should able to render y-axix on right side', () => {
    imgSnapshotTest(
      `
  %%{init: {"quadrantChart": {"yAxisPosition": "right"}}}%%
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
      `,
      {}
    );
    cy.get('svg');
  });
  it('should able to render x-axix on bottom', () => {
    imgSnapshotTest(
      `
  %%{init: {"quadrantChart": {"xAxisPosition": "bottom"}}}%%
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
      `,
      {}
    );
    cy.get('svg');
  });
  it('should able to render x-axix on bottom and y-axis on right', () => {
    imgSnapshotTest(
      `
  %%{init: {"quadrantChart": {"xAxisPosition": "bottom", "yAxisPosition": "right"}}}%%
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
      `,
      {}
    );
    cy.get('svg');
  });
  it('should render without title', () => {
    imgSnapshotTest(
      `
  quadrantChart
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
      `,
      {}
    );
    cy.get('svg');
  });
  it('should use all the config', () => {
    imgSnapshotTest(
      `
  %%{init: {"quadrantChart": {"chartWidth": 600, "chartHeight": 600, "titlePadding": 20, "titleFontSize": 10, "quadrantPadding": 20, "quadrantTextTopPadding": 40, "quadrantLabelFontSize": 20, "quadrantInternalBorderStrokeWidth": 3, "quadrantExternalBorderStrokeWidth": 5, "xAxisLabelPadding": 20, "xAxisLabelFontSize": 20, "yAxisLabelPadding": 20, "yAxisLabelFontSize": 20, "pointTextPadding": 20, "pointLabelFontSize": 20, "pointRadius": 10 }}}%%
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]
      `,
      {}
    );
    cy.get('svg');
  });
  it('should use all the theme variable', () => {
    imgSnapshotTest(
      `
  %%{init: {"themeVariables": {"quadrant1Fill": "#b4dcff","quadrant2Fill": "#fef0ff", "quadrant3Fill": "#fffaf0", "quadrant4Fill": "#f0fff2", "quadrant1TextFill": "#ff0000", "quadrant2TextFill": "#2d00df", "quadrant3TextFill": "#00ffda", "quadrant4TextFill": "#e68300", "quadrantPointFill": "#0149ff", "quadrantPointTextFill": "#dc00ff", "quadrantXAxisTextFill": "#ffb500", "quadrantYAxisTextFill": "#fae604", "quadrantInternalBorderStrokeFill": "#3636f2", "quadrantExternalBorderStrokeFill": "#ff1010", "quadrantTitleFill": "#00ea19"} }}%%
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]
      `,
      {}
    );
    cy.get('svg');
  });
});
