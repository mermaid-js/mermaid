import { imgSnapshotTest } from '../../helpers/util.ts';

describe('Wardley Maps', () => {
  it('1: should render a basic Tea Shop map', () => {
    imgSnapshotTest(
      `
wardley
title Tea Shop
size [1100, 800]

anchor Business [0.95, 0.63]
component Cup of Tea [0.79, 0.61]
component Tea [0.63, 0.81]
component Hot Water [0.52, 0.80]
component Kettle [0.43, 0.35]
component Power [0.1, 0.7]

Business -> Cup of Tea
Cup of Tea -> Tea
Cup of Tea -> Hot Water
Hot Water -> Kettle
Kettle -> Power

evolve Kettle 0.62
evolve Power 0.89
      `,
      {}
    );
  });

  it('2: should render custom evolution stages', () => {
    imgSnapshotTest(
      `
wardley
title Data Evolution Pipeline
size [1100, 800]

evolution Unmodelled -> Divergent -> Convergent -> Modelled

component User Needs [0.05, 0.95]
component Data Collection [0.15, 0.80]
component Custom Analytics [0.35, 0.70]
component Standardized Reports [0.65, 0.65]
component Commodity Storage [0.85, 0.60]

User Needs -> Data Collection
Data Collection -> Custom Analytics
Custom Analytics -> Standardized Reports
Standardized Reports -> Commodity Storage

evolve Custom Analytics 0.60
evolve Standardized Reports 0.85
      `,
      {}
    );
  });

  it('3: should render pipeline components', () => {
    imgSnapshotTest(
      `
wardley
title Kettle Evolution Pipeline
size [1100, 800]

component Kettle [0.45, 0.57]
component Power [0.70, 0.10]

Kettle -> Power

pipeline Kettle {
  component Campfire Kettle [0.35] label [-60, 35]
  component Electric Kettle [0.53] label [-60, 35]
  component Smart Kettle [0.72] label [-30, 35]
}

Campfire Kettle -> Kettle
Electric Kettle -> Kettle
Smart Kettle -> Kettle
      `,
      {}
    );
  });

  it('4: should render annotations and notes', () => {
    imgSnapshotTest(
      `
wardley
title System Architecture
size [1100, 800]

component User Interface [0.75, 0.85]
component API Gateway [0.60, 0.65]
component Business Logic [0.45, 0.45]
component Database [0.30, 0.25]
component Cache [0.55, 0.35]

User Interface -> API Gateway
API Gateway -> Business Logic
Business Logic -> Database
Business Logic -> Cache

note Key strategic decision [0.65, 0.50]
note High risk area [0.40, 0.35]

annotations [0.05, 0.90]
annotation 1,[0.64, 0.75] Critical user touchpoint
annotation 2,[0.52, 0.60] Integration layer
annotation 3,[0.47, 0.35] Performance optimization
      `,
      {}
    );
  });

  it('5: should render source strategies', () => {
    imgSnapshotTest(
      `
wardley
title Sourcing Strategy Map
size [1100, 600]

anchor Customer [0.80, 0.95]
component Web App [0.45, 0.85] (build)
component Payment Gateway [0.85, 0.65] (buy)
component Analytics [0.60, 0.40] (outsource)
component Cloud Hosting [0.95, 0.25] (market)
component Custom Algorithm [0.30, 0.45] (build) inertia

Customer -> Web App
Web App -> Payment Gateway
Web App -> Analytics
Web App -> Cloud Hosting
Web App -> Custom Algorithm

note Build internal capability [0.48, 0.85]
note Buy from market [0.88, 0.65]
note Outsource to specialists [0.50, 0.30]
      `,
      {}
    );
  });

  it('6: should render custom stage widths', () => {
    imgSnapshotTest(
      `
wardley
title Custom Stage Widths
size [1100, 800]
evolution Genesis@0.2 -> Custom@0.4 -> Product@0.75 -> Commodity@1.0

anchor Business [0.63, 0.95]
component Novel Service [0.75, 0.15]
component Bespoke Platform [0.70, 0.45]
component Off-the-shelf Tool [0.65, 0.72]
component Utility Service [0.60, 0.82]
component Infrastructure [0.30, 0.95]

Business -> Novel Service
Business -> Bespoke Platform
Business -> Off-the-shelf Tool
Business -> Utility Service
Novel Service -> Bespoke Platform
Bespoke Platform -> Off-the-shelf Tool
Off-the-shelf Tool -> Utility Service
Utility Service -> Infrastructure

note Wide Genesis & Custom stages [0.50, 0.15]
note Narrow Commodity stage [0.45, 0.92]
      `,
      {}
    );
  });

  it('7: should render areas and visual grouping', () => {
    imgSnapshotTest(
      `
wardley
title Development Areas
size [1100, 800]

area Frontend [0.80, 0.65]
area Backend [0.55, 0.70]
area Infrastructure [0.30, 0.85]

component UI Framework [0.90, 0.80]
component Components [0.80, 0.70]
component API Gateway [0.70, 0.50]
component Business Logic [0.60, 0.40]
component Database [0.50, 0.25]
component Cloud Platform [0.30, 0.15]

UI Framework -> Components
Components -> API Gateway
API Gateway -> Business Logic
Business Logic -> Database
Database -> Cloud Platform

evolve Database 0.75
      `,
      {}
    );
  });

  it('8: should render link types', () => {
    imgSnapshotTest(
      `
wardley
title Link Features Demo
size [1100, 800]

component User [0.90, 0.95]
component App [0.75, 0.75]
component API [0.60, 0.60]
component Cache [0.45, 0.65]
component Database [0.80, 0.15]
component Service [0.50, 0.50]

User -> App
App +> API
API -> Database
API +<> Cache
Cache +< Service
Service +'backup'> Database
      `,
      {}
    );
  });

  it('9: should render accelerators and deaccelerators', () => {
    imgSnapshotTest(
      `
wardley
title Forces of Change
size [1100, 800]

component Legacy Platform [0.20, 0.85]
component Modern Platform [0.55, 0.60]
component AI Integration [0.70, 0.35]
component Cloud Infrastructure [0.85, 0.15]

Legacy Platform -> Modern Platform
Modern Platform -> AI Integration
AI Integration -> Cloud Infrastructure

accelerator AI Adoption [0.55, 0.25]
deaccelerator Legacy Constraints [0.15, 0.75]

note Accelerators speed up evolution [0.45, 0.35]
note Deaccelerators slow it down [0.05, 0.65]
      `,
      {}
    );
  });

  it('10: should render minimal map', () => {
    imgSnapshotTest(
      `
wardley
title Minimal Example

anchor User [0.90, 0.95]
component Service [0.70, 0.60]
component Platform [0.40, 0.50]

User -> Service
Service -> Platform
      `,
      {}
    );
  });

  it('11: should render dual-label evolution stages', () => {
    imgSnapshotTest(
      `
wardley
title Dual Label Stages
size [1100, 800]

evolution Genesis / Concept -> Custom / Emerging -> Product / Converging -> Commodity / Accepted

component Novel Idea [0.05, 0.20]
component Custom Solution [0.35, 0.50]
component Product Offering [0.65, 0.70]
component Utility Service [0.85, 0.90]

Novel Idea -> Custom Solution
Custom Solution -> Product Offering
Product Offering -> Utility Service
      `,
      {}
    );
  });

  it('12: should render with inertia markers', () => {
    imgSnapshotTest(
      `
wardley
title Components with Inertia
size [1100, 600]

component Legacy System [0.15, 0.95] (inertia)
component New Platform [0.65, 0.45]
component Database [0.25, 0.85] (inertia)
component API [0.55, 0.65]

Legacy System -> Database
New Platform -> API
API -> Database
      `,
      {}
    );
  });
});
