import getStyles, { type FlowChartStyleOptions } from './styles.js';

const getStyleOptions = (
  overrides: Partial<FlowChartStyleOptions> = {}
): FlowChartStyleOptions => ({
  arrowheadColor: '#333333',
  border2: '#666666',
  clusterBkg: '#eeeeee',
  clusterBorder: '#999999',
  edgeLabelBackground: '#ffffff',
  fontFamily: 'Arial',
  lineColor: '#111111',
  mainBkg: '#f8f8f8',
  nodeBorder: '#222222',
  nodeTextColor: '#000000',
  noteBkgColor: '#fff5ad',
  noteTextColor: '#333333',
  tertiaryColor: '#dddddd',
  textColor: '#444444',
  titleColor: '#555555',
  strokeWidth: '1',
  ...overrides,
});

describe('flowchart styles', () => {
  it('styles node notes from theme variables', () => {
    const styles = getStyles(
      getStyleOptions({
        noteBkgColor: '#fef3c7',
        noteTextColor: '#1f2937',
      })
    );

    expect(styles).toContain('.flowchart-note-background');
    expect(styles).toContain('fill: #fef3c7');
    expect(styles).toContain('stroke: none');
    expect(styles).toContain('.flowchart-note-text, .flowchart-note-text > tspan');
    expect(styles).toContain('fill: #1f2937');
  });
});
