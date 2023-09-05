import { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';
import { calculateBlockSizes } from './renderHelpers.js';
import { layout } from './layout.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import {
  select as d3select,
  scaleOrdinal as d3scaleOrdinal,
  schemeTableau10 as d3schemeTableau10,
  ContainerElement,
} from 'd3';

import { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';

// import { diagram as BlockDiagram } from './blockDiagram.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { Uid } from '../../rendering-util/uid.js';

export const draw = async function (
  text: string,
  id: string,
  _version: string,
  diagObj: Diagram
): Promise<void> {
  const { securityLevel, flowchart: conf } = configApi.getConfig();
  const db = diagObj.db as BlockDB;
  let sandboxElement: any;
  if (securityLevel === 'sandbox') {
    sandboxElement = d3select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? d3select(sandboxElement.nodes()[0].contentDocument.body)
      : d3select('body');

  // @ts-ignore TODO root.select is not callable
  const svg = securityLevel === 'sandbox' ? root.select(`[id="${id}"]`) : d3select(`[id="${id}"]`);

  const bl = db.getBlocks();

  const nodes = svg.insert('g').attr('class', 'block');
  await calculateBlockSizes(nodes, bl, db);
  const bounds = layout(db);

  console.log('Here', bl);

  // Establish svg dimensions and get width and height
  //
  // const bounds = nodes.node().getBoundingClientRect();
  const height = bounds.height;
  const width = bounds.width;
  const useMaxWidth = false;
  configureSvgSize(svg, height, width, useMaxWidth);
  console.log('Here Bounds', bounds);
  svg.attr('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);

  // Prepare data for construction based on diagObj.db
  // This must be a mutable object with `nodes` and `links` properties:
  //
  // @ts-ignore TODO: db type
  // const graph = diagObj.db.getGraph();

  // const nodeWidth = 10;

  // Create rectangles for nodes
  // const db:BlockDB = diagObj.db;

  interface LayedBlock extends Block {
    children?: LayedBlock[];
    x?: number;
    y?: number;
  }

  const blocks: LayedBlock[] = [
    {
      ID: 'ApplicationLayer',
      label: 'Application Layer',
      x: 0,
      y: 0,
      children: [
        {
          ID: 'UserInterface',
          label: 'User Interface (WPF, HTML5/CSS3, Swing)',
          x: 0,
          y: 50,
        },
      ],
    },
    {
      ID: 'PresentationLayer',
      label: 'Presentation Layer',
      x: 0,
      y: 50,
      children: [
        {
          ID: 'Smack',
          label: 'J2SE Mobil App (Smack)',
        },
        {
          ID: 'JsJAC',
          label: 'Java Script Browser App (JsJAC)',
        },
        {
          ID: 'babelim',
          label: '.NET Windows App (Babel-im)',
        },
      ],
    },
    {
      ID: 'SessionLayer',
      label: 'Session Layer',
      x: 0,
      y: 100,
      children: [
        {
          ID: 'XMPP',
          label: 'XMPP Component',
        },
        {
          children: [
            {
              ID: 'Authentication',
              label: 'Authentication',
            },
            {
              ID: 'Authorization',
              label: 'Authorization',
            },
          ],
        },
        {
          ID: 'LDAP',
          label: 'LDAP, DB, POP',
        },
      ],
    },
    {
      ID: 'NetworkLayer',
      label: 'Network Layer',
      x: 0,
      y: 150,
      children: [
        { ID: 'HTTP', label: 'HTTP' },
        { ID: 'SOCK', label: 'SOCK' },
      ],
    },
    {
      ID: 'DataLayer',
      label: 'Data Layer',
      x: 0,
      y: 200,
      children: [
        { ID: 'XMPP', label: 'XMPP' },
        { ID: 'BDB', label: 'Business DB' },
        { ID: 'AD', label: 'Active Directory' },
      ],
    },
  ];

  // Get color scheme for the graph
  const colorScheme = d3scaleOrdinal(d3schemeTableau10);
};

export default {
  draw,
};
