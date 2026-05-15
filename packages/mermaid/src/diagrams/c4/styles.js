const getStyles = (options) => `
/* Person Styles */
.node.person rect:not(.sprite rect), 
.node.person circle:not(.sprite circle), 
.node.person ellipse:not(.sprite ellipse), 
.node.person polygon:not(.sprite polygon), 
.node.person path:not(.sprite path) {
  stroke: ${options.personBorder};
  fill: ${options.personBkg};
}

.node.person.external rect:not(.sprite rect), 
.node.person.external circle:not(.sprite circle), 
.node.person.external ellipse:not(.sprite ellipse), 
.node.person.external polygon:not(.sprite polygon), 
.node.person.external path:not(.sprite path) {
  stroke: ${options.personExtBorder};
  fill: ${options.personExtBkg};
}

/* System Styles */
.node.system rect:not(.sprite rect), 
.node.system circle:not(.sprite circle), 
.node.system ellipse:not(.sprite ellipse), 
.node.system polygon:not(.sprite polygon), 
.node.system path:not(.sprite path) {
  stroke: ${options.systemBorder};
  fill: ${options.systemBkg};
}

.node.system.external rect:not(.sprite rect), 
.node.system.external circle:not(.sprite circle), 
.node.system.external ellipse:not(.sprite ellipse), 
.node.system.external polygon:not(.sprite polygon), 
.node.system.external path:not(.sprite path) {
  stroke: ${options.systemExtBorder};
  fill: ${options.systemExtBkg};
}

/* System Database Styles */
.node.system.database rect:not(.sprite rect), 
.node.system.database circle:not(.sprite circle), 
.node.system.database ellipse:not(.sprite ellipse), 
.node.system.database polygon:not(.sprite polygon), 
.node.system.database path:not(.sprite path) {
  stroke: ${options.systemDbBorder};
  fill: ${options.systemDbBkg};
}

.node.system.database.external rect:not(.sprite rect), 
.node.system.database.external circle:not(.sprite circle), 
.node.system.database.external ellipse:not(.sprite ellipse), 
.node.system.database.external polygon:not(.sprite polygon), 
.node.system.database.external path:not(.sprite path) {
  stroke: ${options.systemExtDbBorder};
  fill: ${options.systemExtDbBkg};
}

/* System Queue Styles */
.node.system.queue rect:not(.sprite rect), 
.node.system.queue circle:not(.sprite circle), 
.node.system.queue ellipse:not(.sprite ellipse), 
.node.system.queue polygon:not(.sprite polygon), 
.node.system.queue path:not(.sprite path) {
  stroke: ${options.systemQueueBorder};
  fill: ${options.systemQueueBkg};
}

.node.system.queue.external rect:not(.sprite rect), 
.node.system.queue.external circle:not(.sprite circle), 
.node.system.queue.external ellipse:not(.sprite ellipse), 
.node.system.queue.external polygon:not(.sprite polygon), 
.node.system.queue.external path:not(.sprite path) {
  stroke: ${options.systemExtQueueBorder};
  fill: ${options.systemExtQueueBkg};
}

/* Container Styles */
.node.container rect:not(.sprite rect), 
.node.container circle:not(.sprite circle), 
.node.container ellipse:not(.sprite ellipse), 
.node.container polygon:not(.sprite polygon), 
.node.container path:not(.sprite path) {
  stroke: ${options.containerBorder};
  fill: ${options.containerBkg};
}

.node.container.external rect:not(.sprite rect), 
.node.container.external circle:not(.sprite circle), 
.node.container.external ellipse:not(.sprite ellipse), 
.node.container.external polygon:not(.sprite polygon), 
.node.container.external path:not(.sprite path) {
  stroke: ${options.containerExtBorder};
  fill: ${options.containerExtBkg};
}

/* Container Database Styles */
.node.container.database rect:not(.sprite rect), 
.node.container.database circle:not(.sprite circle), 
.node.container.database ellipse:not(.sprite ellipse), 
.node.container.database polygon:not(.sprite polygon), 
.node.container.database path:not(.sprite path) {
  stroke: ${options.containerDbBorder};
  fill: ${options.containerDbBkg};
}

.node.container.database.external rect:not(.sprite rect), 
.node.container.database.external circle:not(.sprite circle), 
.node.container.database.external ellipse:not(.sprite ellipse), 
.node.container.database.external polygon:not(.sprite polygon), 
.node.container.database.external path:not(.sprite path) {
  stroke: ${options.containerExtDbBorder};
  fill: ${options.containerExtDbBkg};
}

/* Container Queue Styles */
.node.container.queue rect:not(.sprite rect), 
.node.container.queue circle:not(.sprite circle), 
.node.container.queue ellipse:not(.sprite ellipse), 
.node.container.queue polygon:not(.sprite polygon), 
.node.container.queue path:not(.sprite path) {
  stroke: ${options.containerQueueBorder};
  fill: ${options.containerQueueBkg};
}

.node.container.queue.external rect:not(.sprite rect), 
.node.container.queue.external circle:not(.sprite circle), 
.node.container.queue.external ellipse:not(.sprite ellipse), 
.node.container.queue.external polygon:not(.sprite polygon), 
.node.container.queue.external path:not(.sprite path) {
  stroke: ${options.containerExtQueueBorder};
  fill: ${options.containerExtQueueBkg};
}

/* Component Styles */
.node.component rect:not(.sprite rect), 
.node.component circle:not(.sprite circle), 
.node.component ellipse:not(.sprite ellipse), 
.node.component polygon:not(.sprite polygon), 
.node.component path:not(.sprite path) {
  stroke: ${options.componentBorder};
  fill: ${options.componentBkg};
}

.node.component.external rect:not(.sprite rect), 
.node.component.external circle:not(.sprite circle), 
.node.component.external ellipse:not(.sprite ellipse), 
.node.component.external polygon:not(.sprite polygon), 
.node.component.external path:not(.sprite path) {
  stroke: ${options.componentExtBorder};
  fill: ${options.componentExtBkg};
}

/* Component Database Styles */
.node.component.database rect:not(.sprite rect), 
.node.component.database circle:not(.sprite circle), 
.node.component.database ellipse:not(.sprite ellipse), 
.node.component.database polygon:not(.sprite polygon), 
.node.component.database path:not(.sprite path) {
  stroke: ${options.componentDbBorder};
  fill: ${options.componentDbBkg};
}

.node.component.database.external rect:not(.sprite rect), 
.node.component.database.external circle:not(.sprite circle), 
.node.component.database.external ellipse:not(.sprite ellipse), 
.node.component.database.external polygon:not(.sprite polygon), 
.node.component.database.external path:not(.sprite path) {
  stroke: ${options.componentExtDbBorder};
  fill: ${options.componentExtDbBkg};
}

/* Component Queue Styles */
.node.component.queue rect:not(.sprite rect), 
.node.component.queue circle:not(.sprite circle), 
.node.component.queue ellipse:not(.sprite ellipse), 
.node.component.queue polygon:not(.sprite polygon), 
.node.component.queue path:not(.sprite path) {
  stroke: ${options.componentQueueBorder};
  fill: ${options.componentQueueBkg};
}

.node.component.queue.external rect:not(.sprite rect), 
.node.component.queue.external circle:not(.sprite circle), 
.node.component.queue.external ellipse:not(.sprite ellipse), 
.node.component.queue.external polygon:not(.sprite polygon), 
.node.component.queue.external path:not(.sprite path) {
  stroke: ${options.componentExtQueueBorder};
  fill: ${options.componentExtQueueBkg};
}

/* Default node styles (fallback) */
.node rect:not(.sprite rect),
.node circle:not(.sprite circle),
.node ellipse:not(.sprite ellipse),
.node polygon:not(.sprite polygon),
.node path:not(.sprite path) {
  fill: ${options.mainBkg};
  stroke: ${options.nodeBorder};
  stroke-width: 1px;
}

/* Cluster styles */
.cluster rect {
  stroke: ${options.nodeBorder};
  stroke-width: 1px;
  stroke-dasharray: 7,7;
  fill: transparent;
}

.cluster.deployment rect {
  stroke-dasharray: none;
}

/* Edge styles */
.edge {
  stroke: ${options.lineColor};
  stroke-width: 1;
  fill: none;
}

/* Label styles */
.nodeLabel {
  color: ${options.c4NodeTextColor};
}

.edgeLabel {
  color: ${options.primaryTextColor};
}

.cluster-label .nodeLabel {
  color: ${options.primaryTextColor};
}

.edgeLabel .label rect {
  fill: ${options.mainBkg};
}

.label text {
  fill: ${options.c4NodeTextColor};
}

.edgeLabel .labelBkg {
  background: ${options.mainBkg};
}

.edgeLabel .label span {
  background: ${options.mainBkg};
}

/* Sprite styles */
.sprite path, 
.sprite ellipse, 
.sprite line, 
.sprite circle, 
.sprite text {
  fill: ${options.c4NodeTextColor};
  stroke: ${options.c4NodeTextColor};
}

/* Legend styles */
.legendBkg {
  fill: ${options.clusterBkg};
  stroke: ${options.clusterBorder};
}
`;

export default getStyles;
