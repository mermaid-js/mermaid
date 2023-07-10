import { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';

import {
  select as d3select,
  scaleOrdinal as d3scaleOrdinal,
  schemeTableau10 as d3schemeTableau10,
} from 'd3';

import { BlockDB, Block } from './blockDB.js';

// import { diagram as BlockDiagram } from './blockDiagram.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { Uid } from '../../rendering-util/uid.js';

export const draw = function (text: string, id: string, _version: string, diagObj: Diagram): void {
  const { securityLevel } = configApi.getConfig();
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

  // Establish svg dimensions and get width and height
  //  
  const height = 400;
  const width = 600;
  const useMaxWidth = false;
  configureSvgSize(svg, height, width, useMaxWidth);

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
      ID: "ApplicationLayer",
      label: "Application Layer",
      x: 0,
      y: 0,
      children: [
        {
          ID: "UserInterface",
          label: "User Interface (WPF, HTML5/CSS3, Swing)",
          x: 0,
          y: 50,    
        }
      ],
    },
    {
      ID: "PresentationLayer",
      label: "Presentation Layer",
      x: 0,
      y: 50,
      children: [
        {
          ID: "Smack",
          label: "J2SE Mobil App (Smack)"
        },
        {
          ID: "JsJAC",
          label: "Java Script Browser App (JsJAC)",
        },
        {
          ID: "babelim",
          label: ".NET Windows App (Babel-im)",
        },
      ]
    },
    {
      ID: "SessionLayer",
      label: "Session Layer",
      x: 0,
      y: 100,
      children: [
        {
          ID: "XMPP",
          label: "XMPP Component"
        },
        {
          children: [
            {
              ID: "Authentication",
              label: "Authentication",
            },
            {
              ID: "Authorization",
              label: "Authorization",
            },
          ]
        },
        {
          ID: "LDAP",
          label: "LDAP, DB, POP",
        },
      ]
    },
    {
      ID: "NetworkLayer",
      label: "Network Layer",
      x: 0,
      y: 150,
      children: [
        { ID: "HTTP", label: "HTTP" },
        { ID: "SOCK", label: "SOCK" },
      ]
    },
    {
      ID: "DataLayer",
      label: "Data Layer",
      x: 0,
      y: 200,
      children: [
        { ID: "XMPP", label: "XMPP" },
        { ID: "BDB", label: "Business DB" },
        { ID: "AD", label: "Active Directory" },
      ]
    },
  ];

  // Get color scheme for the graph
  const colorScheme = d3scaleOrdinal(d3schemeTableau10);

  svg
    .append('g')
    .attr('class', 'block')
    .selectAll('.block')
    .data(blocks)
    .join('rect')
    .attr('x', (d: any) => d.x || 0)
    .attr('y', (d: any) => d.y || 0)
    .attr('class', 'block')
    .attr('stroke', 'black')
    .attr('height', (d: any) => 50)
    .attr('width', (d: any) => 100)
    .attr('fill', (d: any) => colorScheme(d.ID));

};

export default {
  draw,
};
