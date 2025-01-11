import { imgSnapshotTest } from '../../helpers/util.ts';

describe('Quadrant Chart', () => {
  it('should render if only chart type is provided', () => {
    imgSnapshotTest(
      `
  quadrantChart
      `,
      {}
    );
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
  });
  it('should render x-axis labels in the center, if x-axis has two labels', () => {
    imgSnapshotTest(
      `
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement
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
  });
  it('should render y-axis labels in the center, if y-axis has two labels', () => {
    imgSnapshotTest(
      `
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach
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
  });
  it('should render both axes labels on the left and bottom, if both axes have only one label', () => {
    imgSnapshotTest(
      `
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Reach -->
    y-axis Engagement -->
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
  });

  it('it should render data points with styles', () => {
    imgSnapshotTest(
      `
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Reach -->
    y-axis Engagement -->
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6] radius: 20
    Campaign B: [0.45, 0.23]     color: #ff0000  
    Campaign C: [0.57, 0.69]  stroke-color: #ff00ff  
    Campaign D: [0.78, 0.34]        stroke-width: 3px    
    Campaign E: [0.40, 0.34] radius: 20,   color: #ff0000  , stroke-color  : #ff00ff,     stroke-width    :   3px   
    Campaign F: [0.35, 0.78] stroke-width: 3px , color: #ff0000, radius: 20, stroke-color:     #ff00ff
    Campaign G: [0.22, 0.22] stroke-width: 3px  , color: #309708  ,  radius  : 20  ,  stroke-color:    #5060ff
    Campaign H: [0.22, 0.44]
      `,
      {}
    );
  });

  it('it should render data points with styles + classes', () => {
    imgSnapshotTest(
      `
  quadrantChart
    title Reach and engagement of campaigns
    x-axis Reach -->
    y-axis Engagement -->
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A:::class1: [0.3, 0.6] radius: 20
    Campaign B: [0.45, 0.23] color: #ff0000
    Campaign C: [0.57, 0.69] stroke-color: #ff00ff
    Campaign D:::class2: [0.78, 0.34] stroke-width: 3px
    Campaign E:::class2: [0.40, 0.34] radius: 20, color: #ff0000, stroke-color: #ff00ff, stroke-width: 3px
    Campaign F:::class1: [0.35, 0.78]
    classDef class1 color: #908342, radius : 10, stroke-color: #310085, stroke-width: 10px
    classDef class2 color: #f00fff, radius : 10
    `
    );
  });
});
