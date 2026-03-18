import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { Diagram } from '../../Diagram.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { WardleyBuildResult, WardleyNode } from './wardleyBuilder.js';

const DEFAULT_STAGES = ['Genesis', 'Custom Built', 'Product', 'Commodity'];

interface WardleyTheme {
  backgroundColor: string;
  axisColor: string;
  axisTextColor: string;
  gridColor: string;
  componentFill: string;
  componentStroke: string;
  componentLabelColor: string;
  linkStroke: string;
  evolutionStroke: string;
  annotationStroke: string;
  annotationTextColor: string;
  annotationFill: string;
}

const getTheme = (): WardleyTheme => {
  const { themeVariables } = getConfig();
  return {
    backgroundColor: themeVariables.wardley?.backgroundColor ?? themeVariables.background ?? '#fff',
    axisColor: themeVariables.wardley?.axisColor ?? '#000',
    axisTextColor:
      themeVariables.wardley?.axisTextColor ?? themeVariables.primaryTextColor ?? '#222',
    gridColor: themeVariables.wardley?.gridColor ?? 'rgba(100, 100, 100, 0.2)',
    componentFill: themeVariables.wardley?.componentFill ?? '#fff',
    componentStroke: themeVariables.wardley?.componentStroke ?? '#000',
    componentLabelColor:
      themeVariables.wardley?.componentLabelColor ?? themeVariables.primaryTextColor ?? '#222',
    linkStroke: themeVariables.wardley?.linkStroke ?? '#000',
    evolutionStroke: themeVariables.wardley?.evolutionStroke ?? '#dc3545',
    annotationStroke: themeVariables.wardley?.annotationStroke ?? '#000',
    annotationTextColor:
      themeVariables.wardley?.annotationTextColor ?? themeVariables.primaryTextColor ?? '#222',
    annotationFill: themeVariables.wardley?.annotationFill ?? themeVariables.background ?? '#fff',
  };
};

const getConfigValues = () => {
  const wardleyConfig = getConfig()['wardley-beta'];
  return {
    width: wardleyConfig?.width ?? 900,
    height: wardleyConfig?.height ?? 600,
    padding: wardleyConfig?.padding ?? 48,
    nodeRadius: wardleyConfig?.nodeRadius ?? 6,
    nodeLabelOffset: wardleyConfig?.nodeLabelOffset ?? 8,
    axisFontSize: wardleyConfig?.axisFontSize ?? 12,
    labelFontSize: wardleyConfig?.labelFontSize ?? 10,
    showGrid: wardleyConfig?.showGrid ?? false,
    useMaxWidth: wardleyConfig?.useMaxWidth ?? true,
  };
};

export const draw = (text: string, id: string, _version: string, diagObj: Diagram) => {
  log.debug('Rendering Wardley map\n' + text);

  const configValues = getConfigValues();
  const theme = getTheme();
  const squareSize = configValues.nodeRadius * 1.6; // Size of pipeline parent square nodes
  const db = diagObj.db as {
    getWardleyData: () => WardleyBuildResult;
    getDiagramTitle: () => string;
  };
  const data = db.getWardleyData();
  const title = db.getDiagramTitle();

  // Override size if specified in diagram
  const width = data.size?.width ?? configValues.width;
  const height = data.size?.height ?? configValues.height;

  const svg = selectSvgElement(id);
  svg.selectAll('*').remove();

  configureSvgSize(svg, height, width, configValues.useMaxWidth);
  svg.attr('viewBox', `0 0 ${width} ${height}`);

  const root = svg.append('g').attr('class', 'wardley-map');

  // Define arrow markers
  const defs = svg.append('defs');

  // Evolution trend arrow (red)
  defs
    .append('marker')
    .attr('id', `arrow-${id}`)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', theme.evolutionStroke)
    .attr('stroke', 'none');

  // Link flow arrow (theme color)
  defs
    .append('marker')
    .attr('id', `link-arrow-end-${id}`)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', theme.linkStroke)
    .attr('stroke', 'none');

  // Link flow arrow start (for backward/bidirectional)
  defs
    .append('marker')
    .attr('id', `link-arrow-start-${id}`)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 1)
    .attr('refY', 5)
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 10 0 L 0 5 L 10 10 z')
    .attr('fill', theme.linkStroke)
    .attr('stroke', 'none');

  root
    .append('rect')
    .attr('class', 'wardley-background')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', theme.backgroundColor);

  const chartWidth = width - configValues.padding * 2;
  const chartHeight = height - configValues.padding * 2;

  // Render title if present
  if (title) {
    root
      .append('text')
      .attr('class', 'wardley-title')
      .attr('x', width / 2)
      .attr('y', configValues.padding / 2)
      .attr('fill', theme.axisTextColor)
      .attr('font-size', configValues.axisFontSize * 1.05)
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(title);
  }

  const projectX = (value: number) => configValues.padding + (value / 100) * chartWidth;
  const projectY = (value: number) => height - configValues.padding - (value / 100) * chartHeight;

  const axisGroup = root.append('g').attr('class', 'wardley-axes');
  axisGroup
    .append('line')
    .attr('x1', configValues.padding)
    .attr('x2', width - configValues.padding)
    .attr('y1', height - configValues.padding)
    .attr('y2', height - configValues.padding)
    .attr('stroke', theme.axisColor)
    .attr('stroke-width', 1);
  axisGroup
    .append('line')
    .attr('x1', configValues.padding)
    .attr('x2', configValues.padding)
    .attr('y1', configValues.padding)
    .attr('y2', height - configValues.padding)
    .attr('stroke', theme.axisColor)
    .attr('stroke-width', 1);

  const xLabel = data.axes.xLabel ?? 'Evolution';
  const yLabel = data.axes.yLabel ?? 'Visibility';

  axisGroup
    .append('text')
    .attr('class', 'wardley-axis-label wardley-axis-label-x')
    .attr('x', configValues.padding + chartWidth / 2)
    .attr('y', height - configValues.padding / 4)
    .attr('fill', theme.axisTextColor)
    .attr('font-size', configValues.axisFontSize)
    .attr('font-weight', 'bold')
    .attr('text-anchor', 'middle')
    .text(xLabel);
  axisGroup
    .append('text')
    .attr('class', 'wardley-axis-label wardley-axis-label-y')
    .attr('x', configValues.padding / 3)
    .attr('y', configValues.padding + chartHeight / 2)
    .attr('fill', theme.axisTextColor)
    .attr('font-size', configValues.axisFontSize)
    .attr('font-weight', 'bold')
    .attr('text-anchor', 'middle')
    .attr(
      'transform',
      `rotate(-90 ${configValues.padding / 3} ${configValues.padding + chartHeight / 2})`
    )
    .text(yLabel);

  const stages =
    data.axes.stages && data.axes.stages.length > 0 ? data.axes.stages : DEFAULT_STAGES;
  if (stages.length > 0) {
    const stageGroup = root.append('g').attr('class', 'wardley-stages');
    const boundaries = data.axes.stageBoundaries;

    // Calculate stage positions
    const stagePositions: { start: number; end: number }[] = [];
    if (boundaries && boundaries.length === stages.length) {
      // Use custom boundaries
      let prevBoundary = 0;
      boundaries.forEach((boundary) => {
        stagePositions.push({ start: prevBoundary, end: boundary });
        prevBoundary = boundary;
      });
    } else {
      // Use equal distribution
      const stageWidth = 1.0 / stages.length;
      stages.forEach((_, index) => {
        stagePositions.push({
          start: index * stageWidth,
          end: (index + 1) * stageWidth,
        });
      });
    }

    stages.forEach((stage, index) => {
      const pos = stagePositions[index];
      const startX = configValues.padding + pos.start * chartWidth;
      const endX = configValues.padding + pos.end * chartWidth;
      const centerX = (startX + endX) / 2;

      // Draw dividing line (except before first stage)
      if (index > 0) {
        stageGroup
          .append('line')
          .attr('x1', startX)
          .attr('x2', startX)
          .attr('y1', configValues.padding)
          .attr('y2', height - configValues.padding)
          .attr('stroke', '#000')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '5 5')
          .attr('opacity', 0.8);
      }

      // Draw stage label
      stageGroup
        .append('text')
        .attr('class', 'wardley-stage-label')
        .attr('x', centerX)
        .attr('y', height - configValues.padding / 1.5)
        .attr('fill', theme.axisTextColor)
        .attr('font-size', configValues.axisFontSize - 2)
        .attr('text-anchor', 'middle')
        .text(stage);
    });
  }

  if (configValues.showGrid) {
    const gridGroup = root.append('g').attr('class', 'wardley-grid');
    for (let i = 1; i < 4; i++) {
      const ratio = i / 4;
      const x = configValues.padding + chartWidth * ratio;
      gridGroup
        .append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', configValues.padding)
        .attr('y2', height - configValues.padding)
        .attr('stroke', theme.gridColor)
        .attr('stroke-dasharray', '2 6');
      gridGroup
        .append('line')
        .attr('x1', configValues.padding)
        .attr('x2', width - configValues.padding)
        .attr('y1', height - configValues.padding - chartHeight * ratio)
        .attr('y2', height - configValues.padding - chartHeight * ratio)
        .attr('stroke', theme.gridColor)
        .attr('stroke-dasharray', '2 6');
    }
  }

  const positions = new Map<string, { x: number; y: number; node: WardleyNode }>();
  data.nodes.forEach((node) => {
    positions.set(node.id, {
      x: projectX(node.x!),
      y: projectY(node.y!),
      node,
    });
  });

  // Render pipeline boxes and evolution links
  if (data.pipelines.length > 0) {
    const pipelineGroup = root.append('g').attr('class', 'wardley-pipelines');
    const pipelineLinksGroup = root.append('g').attr('class', 'wardley-pipeline-links');

    data.pipelines.forEach((pipeline) => {
      if (pipeline.componentIds.length === 0) {
        return;
      }

      // Sort components by X coordinate (evolution) to draw links in order
      const sortedComponents = pipeline.componentIds
        .map((id) => ({ id, pos: positions.get(id), node: data.nodes.find((n) => n.id === id) }))
        .filter((c) => c.pos && c.node)
        .sort((a, b) => a.node!.x! - b.node!.x!);

      // Draw dotted links between consecutive pipeline components
      for (let i = 0; i < sortedComponents.length - 1; i++) {
        const current = sortedComponents[i];
        const next = sortedComponents[i + 1];

        pipelineLinksGroup
          .append('line')
          .attr('class', 'wardley-pipeline-evolution-link')
          .attr('x1', current.pos!.x)
          .attr('y1', current.pos!.y)
          .attr('x2', next.pos!.x)
          .attr('y2', next.pos!.y)
          .attr('stroke', theme.linkStroke)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4 4');
      }

      // Find min and max X coordinates of pipeline components
      let minX = Infinity;
      let maxX = -Infinity;
      let y = 0;

      pipeline.componentIds.forEach((componentId) => {
        const pos = positions.get(componentId);
        if (pos) {
          minX = Math.min(minX, pos.x);
          maxX = Math.max(maxX, pos.x);
          y = pos.y;
        }
      });

      if (minX !== Infinity && maxX !== -Infinity) {
        const padding = 15; // Padding around the box
        const height = configValues.nodeRadius * 4; // Height of the pipeline box
        const boxTop = y - height / 2;

        // Position the parent node at the top of the pipeline box, 2/3 outside, 1/3 inside
        const parentPos = positions.get(pipeline.nodeId);
        if (parentPos) {
          const centerX = (minX + maxX) / 2;
          parentPos.x = centerX;
          parentPos.y = boxTop - squareSize / 6; // Position so 2/3 is outside, 1/3 inside
        }

        pipelineGroup
          .append('rect')
          .attr('class', 'wardley-pipeline-box')
          .attr('x', minX - padding)
          .attr('y', boxTop)
          .attr('width', maxX - minX + padding * 2)
          .attr('height', height)
          .attr('fill', 'none')
          .attr('stroke', theme.axisColor)
          .attr('stroke-width', 1.5)
          .attr('rx', 4)
          .attr('ry', 4);
      }
    });
  }

  const linksGroup = root.append('g').attr('class', 'wardley-links');

  // Build a map of pipeline parent -> component IDs for filtering
  const pipelineMap = new Map<string, Set<string>>();
  data.pipelines.forEach((pipeline) => {
    pipelineMap.set(pipeline.nodeId, new Set(pipeline.componentIds));
  });

  const validLinks = data.links.filter((link) => {
    // Check if link has valid positions
    if (!positions.has(link.source) || !positions.has(link.target)) {
      return false;
    }

    // Filter out links from pipeline components to their parent
    const pipelineComponents = pipelineMap.get(link.target);
    if (pipelineComponents?.has(link.source)) {
      return false;
    }

    return true;
  });
  linksGroup
    .selectAll('line')
    .data(validLinks)
    .enter()
    .append('line')
    .attr('class', (link) => `wardley-link${link.dashed ? ' wardley-link--dashed' : ''}`)
    .attr('x1', (link) => {
      const sourcePos = positions.get(link.source)!;
      const targetPos = positions.get(link.target)!;
      const sourceNode = data.nodes.find((n) => n.id === link.source)!;
      const radius = sourceNode.isPipelineParent
        ? squareSize / Math.sqrt(2)
        : configValues.nodeRadius;
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return sourcePos.x + (dx / distance) * radius;
    })
    .attr('y1', (link) => {
      const sourcePos = positions.get(link.source)!;
      const targetPos = positions.get(link.target)!;
      const sourceNode = data.nodes.find((n) => n.id === link.source)!;
      const radius = sourceNode.isPipelineParent
        ? squareSize / Math.sqrt(2)
        : configValues.nodeRadius;
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return sourcePos.y + (dy / distance) * radius;
    })
    .attr('x2', (link) => {
      const sourcePos = positions.get(link.source)!;
      const targetPos = positions.get(link.target)!;
      const targetNode = data.nodes.find((n) => n.id === link.target)!;
      const radius = targetNode.isPipelineParent
        ? squareSize / Math.sqrt(2)
        : configValues.nodeRadius;
      const dx = sourcePos.x - targetPos.x;
      const dy = sourcePos.y - targetPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return targetPos.x + (dx / distance) * radius;
    })
    .attr('y2', (link) => {
      const sourcePos = positions.get(link.source)!;
      const targetPos = positions.get(link.target)!;
      const targetNode = data.nodes.find((n) => n.id === link.target)!;
      const radius = targetNode.isPipelineParent
        ? squareSize / Math.sqrt(2)
        : configValues.nodeRadius;
      const dx = sourcePos.x - targetPos.x;
      const dy = sourcePos.y - targetPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return targetPos.y + (dy / distance) * radius;
    })
    .attr('stroke', theme.linkStroke)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', (link) => (link.dashed ? '6 6' : null))
    .attr('marker-end', (link) => {
      if (link.flow === 'forward' || link.flow === 'bidirectional') {
        return `url(#link-arrow-end-${id})`;
      }
      return null;
    })
    .attr('marker-start', (link) => {
      if (link.flow === 'backward' || link.flow === 'bidirectional') {
        return `url(#link-arrow-start-${id})`;
      }
      return null;
    });

  // Add link labels
  linksGroup
    .selectAll('text')
    .data(validLinks.filter((link) => link.label))
    .enter()
    .append('text')
    .attr('class', 'wardley-link-label')
    .attr('x', (link) => {
      const sourcePos = positions.get(link.source)!;
      const targetPos = positions.get(link.target)!;
      const midX = (sourcePos.x + targetPos.x) / 2;
      const dy = targetPos.y - sourcePos.y;
      const dx = targetPos.x - sourcePos.x;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const offset = 8; // Distance above the line
      // Perpendicular x component (for offsetting horizontally)
      const perpX = dy / distance;
      return midX + perpX * offset;
    })
    .attr('y', (link) => {
      const sourcePos = positions.get(link.source)!;
      const targetPos = positions.get(link.target)!;
      const midY = (sourcePos.y + targetPos.y) / 2;
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const offset = 8; // Distance above the line
      // Perpendicular y component (for offsetting vertically)
      const perpY = -dx / distance;
      return midY + perpY * offset;
    })
    .attr('fill', theme.axisTextColor)
    .attr('font-size', configValues.labelFontSize)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('transform', (link) => {
      const sourcePos = positions.get(link.source)!;
      const targetPos = positions.get(link.target)!;
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const offset = 8; // Distance above the line
      // Perpendicular vector pointing "up" relative to line direction
      const perpX = dy / distance;
      const perpY = -dx / distance;
      const labelX = midX + perpX * offset;
      const labelY = midY + perpY * offset;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      // Flip text if it would be upside down
      if (angle > 90 || angle < -90) {
        angle += 180;
      }
      return `rotate(${angle} ${labelX} ${labelY})`;
    })
    .text((link) => link.label!);

  const trendGroup = root.append('g').attr('class', 'wardley-trends');
  interface TrendWithPositions {
    origin: { x: number; y: number; node: WardleyNode };
    targetX: number;
    targetY: number;
    adjustedX2: number;
    adjustedY2: number;
  }
  const trendsWithPositions: TrendWithPositions[] = data.trends
    .map((trend) => {
      const origin = positions.get(trend.nodeId);
      if (!origin) {
        return null;
      }
      const targetX = projectX(trend.targetX);
      const targetY = projectY(trend.targetY);

      // Calculate the vector from origin to target
      const dx = targetX - origin.x;
      const dy = targetY - origin.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Shorten the line by nodeRadius so arrow stops at circle edge
      const shortenBy = configValues.nodeRadius + 2; // +2 for small gap
      const adjustedX2 = distance > shortenBy ? targetX - (dx / distance) * shortenBy : targetX;
      const adjustedY2 = distance > shortenBy ? targetY - (dy / distance) * shortenBy : targetY;

      return {
        origin,
        targetX,
        targetY,
        adjustedX2,
        adjustedY2,
      };
    })
    .filter((trend): trend is TrendWithPositions => trend !== null);

  trendGroup
    .selectAll('line')
    .data(trendsWithPositions)
    .enter()
    .append('line')
    .attr('class', 'wardley-trend')
    .attr('x1', (trend) => trend.origin.x)
    .attr('y1', (trend) => trend.origin.y)
    .attr('x2', (trend) => trend.adjustedX2)
    .attr('y2', (trend) => trend.adjustedY2)
    .attr('stroke', theme.evolutionStroke)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4 4')
    .attr('marker-end', `url(#arrow-${id})`);

  const nodesGroup = root.append('g').attr('class', 'wardley-nodes');
  const nodeEnter = nodesGroup
    .selectAll('g')
    .data(data.nodes)
    .enter()
    .append('g')
    .attr('class', (node) =>
      ['wardley-node', node.className ? `wardley-node--${node.className}` : '']
        .filter(Boolean)
        .join(' ')
    );

  // Render outsource overlay circles first (larger dark circle for outsourced components - behind main circle)
  nodeEnter
    .filter((node) => node.sourceStrategy === 'outsource')
    .append('circle')
    .attr('class', 'wardley-outsource-overlay')
    .attr('cx', (node) => positions.get(node.id)!.x)
    .attr('cy', (node) => positions.get(node.id)!.y)
    .attr('r', configValues.nodeRadius * 2)
    .attr('fill', '#666')
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 1);

  // Render buy overlay circles (larger light grey circle for bought components - behind main circle)
  nodeEnter
    .filter((node) => node.sourceStrategy === 'buy')
    .append('circle')
    .attr('class', 'wardley-buy-overlay')
    .attr('cx', (node) => positions.get(node.id)!.x)
    .attr('cy', (node) => positions.get(node.id)!.y)
    .attr('r', configValues.nodeRadius * 2)
    .attr('fill', '#ccc')
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 1);

  // Render build overlay circles (larger very light grey circle with black border for built components - behind main circle)
  nodeEnter
    .filter((node) => node.sourceStrategy === 'build')
    .append('circle')
    .attr('class', 'wardley-build-overlay')
    .attr('cx', (node) => positions.get(node.id)!.x)
    .attr('cy', (node) => positions.get(node.id)!.y)
    .attr('r', configValues.nodeRadius * 2)
    .attr('fill', '#eee')
    .attr('stroke', '#000')
    .attr('stroke-width', 1);

  // Render market overlay (larger circle with three small circles in triangle pattern)
  const marketNodes = nodeEnter.filter((node) => node.sourceStrategy === 'market');

  // Outer circle for market
  marketNodes
    .append('circle')
    .attr('class', 'wardley-market-overlay')
    .attr('cx', (node) => positions.get(node.id)!.x)
    .attr('cy', (node) => positions.get(node.id)!.y)
    .attr('r', configValues.nodeRadius * 2)
    .attr('fill', 'white')
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 1);

  // Render circles for normal nodes and pipeline child components (exclude market components and anchors)
  nodeEnter
    .filter(
      (node) =>
        !node.isPipelineParent && node.sourceStrategy !== 'market' && node.className !== 'anchor'
    )
    .append('circle')
    .attr('cx', (node) => positions.get(node.id)!.x)
    .attr('cy', (node) => positions.get(node.id)!.y)
    .attr('r', configValues.nodeRadius)
    .attr('fill', theme.componentFill)
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 1);

  // Render three small circles in triangle pattern for market components (on top of main circle)
  const smallCircleRadius = configValues.nodeRadius * 0.7;
  const triangleRadius = configValues.nodeRadius * 1.2; // Position so inner circle edges are near outer circle

  // Draw lines connecting the three circles to form a triangle (render first so circles appear on top)
  // Top to bottom-left
  marketNodes
    .append('line')
    .attr('class', 'wardley-market-line')
    .attr('x1', (node) => positions.get(node.id)!.x)
    .attr('y1', (node) => positions.get(node.id)!.y - triangleRadius)
    .attr('x2', (node) => positions.get(node.id)!.x - triangleRadius * Math.cos(Math.PI / 6))
    .attr('y2', (node) => positions.get(node.id)!.y + triangleRadius * Math.sin(Math.PI / 6))
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 1);

  // Line from bottom-left to bottom-right
  marketNodes
    .append('line')
    .attr('class', 'wardley-market-line')
    .attr('x1', (node) => positions.get(node.id)!.x - triangleRadius * Math.cos(Math.PI / 6))
    .attr('y1', (node) => positions.get(node.id)!.y + triangleRadius * Math.sin(Math.PI / 6))
    .attr('x2', (node) => positions.get(node.id)!.x + triangleRadius * Math.cos(Math.PI / 6))
    .attr('y2', (node) => positions.get(node.id)!.y + triangleRadius * Math.sin(Math.PI / 6))
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 1);

  // Line from bottom-right to top
  marketNodes
    .append('line')
    .attr('class', 'wardley-market-line')
    .attr('x1', (node) => positions.get(node.id)!.x + triangleRadius * Math.cos(Math.PI / 6))
    .attr('y1', (node) => positions.get(node.id)!.y + triangleRadius * Math.sin(Math.PI / 6))
    .attr('x2', (node) => positions.get(node.id)!.x)
    .attr('y2', (node) => positions.get(node.id)!.y - triangleRadius)
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 1);

  // Top circle (white fill so it covers the lines)
  marketNodes
    .append('circle')
    .attr('class', 'wardley-market-dot')
    .attr('cx', (node) => positions.get(node.id)!.x)
    .attr('cy', (node) => positions.get(node.id)!.y - triangleRadius)
    .attr('r', smallCircleRadius)
    .attr('fill', 'white')
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 2);

  // Bottom-left circle (white fill so it covers the lines)
  marketNodes
    .append('circle')
    .attr('class', 'wardley-market-dot')
    .attr('cx', (node) => positions.get(node.id)!.x - triangleRadius * Math.cos(Math.PI / 6))
    .attr('cy', (node) => positions.get(node.id)!.y + triangleRadius * Math.sin(Math.PI / 6))
    .attr('r', smallCircleRadius)
    .attr('fill', 'white')
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 2);

  // Bottom-right circle (white fill so it covers the lines)
  marketNodes
    .append('circle')
    .attr('class', 'wardley-market-dot')
    .attr('cx', (node) => positions.get(node.id)!.x + triangleRadius * Math.cos(Math.PI / 6))
    .attr('cy', (node) => positions.get(node.id)!.y + triangleRadius * Math.sin(Math.PI / 6))
    .attr('r', smallCircleRadius)
    .attr('fill', 'white')
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 2);

  // Render squares for pipeline parent nodes
  nodeEnter
    .filter((node) => node.isPipelineParent === true)
    .append('rect')
    .attr('x', (node) => positions.get(node.id)!.x - squareSize / 2)
    .attr('y', (node) => positions.get(node.id)!.y - squareSize / 2)
    .attr('width', squareSize)
    .attr('height', squareSize)
    .attr('fill', theme.componentFill)
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 1);

  // Render inertia indicators (vertical lines to the right of components)
  nodeEnter
    .filter((node) => node.inertia === true)
    .append('line')
    .attr('class', 'wardley-inertia')
    .attr('x1', (node) => {
      const pos = positions.get(node.id)!;
      let offset = node.isPipelineParent ? squareSize / 2 + 15 : configValues.nodeRadius + 15;
      // Add extra offset if component has source strategy overlay
      if (node.sourceStrategy) {
        offset += configValues.nodeRadius + 10;
      }
      return pos.x + offset;
    })
    .attr('y1', (node) => {
      const pos = positions.get(node.id)!;
      const lineHeight = node.isPipelineParent ? squareSize : configValues.nodeRadius * 2;
      return pos.y - lineHeight / 2;
    })
    .attr('x2', (node) => {
      const pos = positions.get(node.id)!;
      let offset = node.isPipelineParent ? squareSize / 2 + 15 : configValues.nodeRadius + 15;
      // Add extra offset if component has source strategy overlay
      if (node.sourceStrategy) {
        offset += configValues.nodeRadius + 10;
      }
      return pos.x + offset;
    })
    .attr('y2', (node) => {
      const pos = positions.get(node.id)!;
      const lineHeight = node.isPipelineParent ? squareSize : configValues.nodeRadius * 2;
      return pos.y + lineHeight / 2;
    })
    .attr('stroke', theme.componentStroke)
    .attr('stroke-width', 6);

  nodeEnter
    .append('text')
    .attr('x', (node) => {
      const pos = positions.get(node.id)!;
      // Anchors have no offset, centered on position
      if (node.className === 'anchor') {
        return node.labelOffsetX !== undefined ? pos.x + node.labelOffsetX : pos.x;
      }
      let defaultOffset = configValues.nodeLabelOffset;
      // Apply automatic spacing for components with source strategy
      if (node.sourceStrategy && node.labelOffsetX === undefined) {
        defaultOffset += 10;
      }
      const customOffset = node.labelOffsetX ?? defaultOffset;
      return pos.x + customOffset;
    })
    .attr('y', (node) => {
      const pos = positions.get(node.id)!;
      // Anchors have small upward offset, centered on position
      if (node.className === 'anchor') {
        return node.labelOffsetY !== undefined ? pos.y + node.labelOffsetY : pos.y - 3;
      }
      let defaultOffset = -configValues.nodeLabelOffset;
      // Apply automatic spacing for components with source strategy
      if (node.sourceStrategy && node.labelOffsetY === undefined) {
        defaultOffset -= 10;
      }
      const customOffset = node.labelOffsetY ?? defaultOffset;
      return pos.y + customOffset;
    })
    .attr('class', 'wardley-node-label')
    .attr('fill', (node) => {
      if (node.className === 'evolved') {
        return theme.evolutionStroke;
      }
      if (node.className === 'anchor') {
        return '#000';
      }
      return theme.componentLabelColor;
    })
    .attr('font-size', configValues.labelFontSize)
    .attr('font-weight', (node) => (node.className === 'anchor' ? 'bold' : 'normal'))
    .attr('text-anchor', (node) => (node.className === 'anchor' ? 'middle' : 'start'))
    .attr('dominant-baseline', (node) => (node.className === 'anchor' ? 'middle' : 'auto'))
    .text((node) => node.label);

  // Render annotations
  if (data.annotations.length > 0) {
    const annotationsGroup = root.append('g').attr('class', 'wardley-annotations');

    data.annotations.forEach((annotation) => {
      // Project all coordinates
      const projectedCoords = annotation.coordinates.map((coord) => ({
        x: projectX(coord.x),
        y: projectY(coord.y),
      }));

      // If there are multiple coordinates, draw lines connecting them
      if (projectedCoords.length > 1) {
        for (let i = 0; i < projectedCoords.length - 1; i++) {
          annotationsGroup
            .append('line')
            .attr('class', 'wardley-annotation-line')
            .attr('x1', projectedCoords[i].x)
            .attr('y1', projectedCoords[i].y)
            .attr('x2', projectedCoords[i + 1].x)
            .attr('y2', projectedCoords[i + 1].y)
            .attr('stroke', theme.axisColor)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '4 4');
        }
      }

      // Draw circles and numbers at each coordinate
      projectedCoords.forEach((coord) => {
        const annotationNode = annotationsGroup.append('g').attr('class', 'wardley-annotation');

        // Draw circle
        annotationNode
          .append('circle')
          .attr('cx', coord.x)
          .attr('cy', coord.y)
          .attr('r', 10)
          .attr('fill', 'white')
          .attr('stroke', theme.axisColor)
          .attr('stroke-width', 1.5);

        // Draw number
        annotationNode
          .append('text')
          .attr('x', coord.x)
          .attr('y', coord.y)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', 10)
          .attr('fill', theme.axisTextColor)
          .attr('font-weight', 'bold')
          .text(annotation.number);
      });
    });

    // Draw annotations text box if position is defined
    if (data.annotationsBox) {
      let boxX = projectX(data.annotationsBox.x);
      let boxY = projectY(data.annotationsBox.y);
      const padding = 10;
      const lineHeight = 16;
      const fontSize = 11;

      // Create text box group
      const textBoxGroup = annotationsGroup.append('g').attr('class', 'wardley-annotations-box');

      // Sort annotations by number
      const sortedAnnotations = [...data.annotations]
        .filter((a) => a.text)
        .sort((a, b) => a.number - b.number);

      // Draw text lines (temporarily to measure)
      const textElements: any[] = [];
      sortedAnnotations.forEach((annotation, idx) => {
        const text = textBoxGroup
          .append('text')
          .attr('x', boxX + padding)
          .attr('y', boxY + padding + (idx + 1) * lineHeight)
          .attr('font-size', fontSize)
          .attr('fill', theme.axisTextColor)
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'middle')
          .text(`${annotation.number}. ${annotation.text}`);
        textElements.push(text);
      });

      // Calculate box dimensions based on text
      if (textElements.length > 0) {
        let maxWidth = 0;
        let maxHeight = 0;
        textElements.forEach((text) => {
          const textNode = text.node() as SVGTextElement;
          // Use getComputedTextLength for more accurate width measurement
          const textWidth = textNode.getComputedTextLength();
          maxWidth = Math.max(maxWidth, textWidth);
          const bbox = textNode.getBBox();
          maxHeight = Math.max(maxHeight, bbox.height);
        });

        // Add extra buffer to padding to ensure text fits comfortably
        const boxWidth = maxWidth + padding * 2 + 105; // Extra 105px buffer for safety
        const boxHeight = sortedAnnotations.length * lineHeight + padding * 2 + maxHeight / 2;

        // Constrain box to stay within map boundaries
        const minX = configValues.padding;
        const maxX = width - configValues.padding - boxWidth;
        const minY = configValues.padding;
        const maxY = height - configValues.padding - boxHeight;

        boxX = Math.max(minX, Math.min(boxX, maxX));
        boxY = Math.max(minY, Math.min(boxY, maxY));

        // Update text positions after clamping
        textElements.forEach((text, idx) => {
          text.attr('x', boxX + padding).attr('y', boxY + padding + (idx + 1) * lineHeight);
        });

        // Draw box background (insert before text)
        textBoxGroup
          .insert('rect', 'text')
          .attr('x', boxX)
          .attr('y', boxY)
          .attr('width', boxWidth)
          .attr('height', boxHeight)
          .attr('fill', 'white')
          .attr('stroke', theme.axisColor)
          .attr('stroke-width', 1.5)
          .attr('rx', 4)
          .attr('ry', 4);
      }
    }
  }

  // Render notes
  if (data.notes.length > 0) {
    const notesGroup = root.append('g').attr('class', 'wardley-notes');

    data.notes.forEach((note) => {
      const noteX = projectX(note.x);
      const noteY = projectY(note.y);

      notesGroup
        .append('text')
        .attr('x', noteX)
        .attr('y', noteY)
        .attr('text-anchor', 'start')
        .attr('font-size', 11)
        .attr('fill', theme.axisTextColor)
        .attr('font-weight', 'bold')
        .text(note.text);
    });
  }

  // Render accelerators (large right-pointing arrows)
  if (data.accelerators.length > 0) {
    const acceleratorsGroup = root.append('g').attr('class', 'wardley-accelerators');

    data.accelerators.forEach((accelerator) => {
      const accX = projectX(accelerator.x);
      const accY = projectY(accelerator.y);

      // Arrow dimensions
      const arrowWidth = 60;
      const arrowHeight = 30;
      const arrowHeadWidth = 20;

      // Draw arrow shape: shaft + arrowhead pointing right
      const arrowPath = `
        M ${accX} ${accY - arrowHeight / 2}
        L ${accX + arrowWidth - arrowHeadWidth} ${accY - arrowHeight / 2}
        L ${accX + arrowWidth - arrowHeadWidth} ${accY - arrowHeight / 2 - 8}
        L ${accX + arrowWidth} ${accY}
        L ${accX + arrowWidth - arrowHeadWidth} ${accY + arrowHeight / 2 + 8}
        L ${accX + arrowWidth - arrowHeadWidth} ${accY + arrowHeight / 2}
        L ${accX} ${accY + arrowHeight / 2}
        Z
      `;

      acceleratorsGroup
        .append('path')
        .attr('d', arrowPath)
        .attr('fill', 'white')
        .attr('stroke', theme.componentStroke)
        .attr('stroke-width', 1);

      // Add label below the arrow
      acceleratorsGroup
        .append('text')
        .attr('x', accX + arrowWidth / 2)
        .attr('y', accY + arrowHeight / 2 + 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', theme.axisTextColor)
        .attr('font-weight', 'bold')
        .text(accelerator.name);
    });
  }

  // Render deaccelerators (large left-pointing arrows)
  if (data.deaccelerators.length > 0) {
    const deacceleratorsGroup = root.append('g').attr('class', 'wardley-deaccelerators');

    data.deaccelerators.forEach((deaccelerator) => {
      const decX = projectX(deaccelerator.x);
      const decY = projectY(deaccelerator.y);

      // Arrow dimensions
      const arrowWidth = 60;
      const arrowHeight = 30;
      const arrowHeadWidth = 20;

      // Draw arrow shape pointing left: shaft + arrowhead pointing left
      const arrowPath = `
        M ${decX + arrowWidth} ${decY - arrowHeight / 2}
        L ${decX + arrowHeadWidth} ${decY - arrowHeight / 2}
        L ${decX + arrowHeadWidth} ${decY - arrowHeight / 2 - 8}
        L ${decX} ${decY}
        L ${decX + arrowHeadWidth} ${decY + arrowHeight / 2 + 8}
        L ${decX + arrowHeadWidth} ${decY + arrowHeight / 2}
        L ${decX + arrowWidth} ${decY + arrowHeight / 2}
        Z
      `;

      deacceleratorsGroup
        .append('path')
        .attr('d', arrowPath)
        .attr('fill', 'white')
        .attr('stroke', theme.componentStroke)
        .attr('stroke-width', 1);

      // Add label below the arrow
      deacceleratorsGroup
        .append('text')
        .attr('x', decX + arrowWidth / 2)
        .attr('y', decY + arrowHeight / 2 + 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', theme.axisTextColor)
        .attr('font-weight', 'bold')
        .text(deaccelerator.name);
    });
  }
};

export default {
  draw,
};
