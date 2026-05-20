import { imgSnapshotTest } from '../../../helpers/util';

describe('network diagrams', () => {
  it('should render a simple network diagram', () => {
    imgSnapshotTest(
      `networkDiagram
  title Simple LAN
  node router : router "Router"
  node sw1 : switch "Switch 1"
  node sw2 : switch "Switch 2"
  node server : server "Server"
  router --- sw1
  router --- sw2
  sw1 --- server : "primary"
  sw2 --- server : "secondary"
`
    );
  });

  it('should render a DMZ topology with multiple device types', () => {
    imgSnapshotTest(
      `networkDiagram
  title DMZ
  node internet : cloud "Internet"
  node fw : firewall "Edge Firewall"
  node sw : switch "DMZ Switch"
  node web : server "Web Server"
  node db : database "Database"
  internet --- fw
  fw --- sw
  sw --- web
  web --- db
`
    );
  });

  it('should render with the network keyword and auto-registered nodes', () => {
    imgSnapshotTest(
      `network
  a --- b
  b --- c
  c --- d
`
    );
  });

  it('should render an empty diagram', () => {
    imgSnapshotTest(`networkDiagram`);
  });
});
