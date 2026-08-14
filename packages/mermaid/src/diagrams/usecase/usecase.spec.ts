import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { getConfig, setConfig } from '../../config.js';
import { sanitizeText } from '../common/common.js';
import { db } from './usecaseDb.js';
import { ARROW_TYPE } from './usecaseTypes.js';
import getStyles from './styles.js';

beforeAll(async () => {
  // Is required to load the useCase diagram
  await Diagram.fromText('usecase-beta\n actor TestActor');
});

/**
 * UseCase diagrams require a basic d3 mock for rendering
 */
vi.mock('d3', () => {
  const NewD3 = function (this: any) {
    function returnThis(this: any) {
      return this;
    }
    return {
      append: function () {
        return NewD3();
      },
      lower: returnThis,
      attr: returnThis,
      style: returnThis,
      text: returnThis,
      getBBox: function () {
        return {
          height: 10,
          width: 20,
        };
      },
    };
  };

  return {
    select: function () {
      return new (NewD3 as any)();
    },

    selectAll: function () {
      return new (NewD3 as any)();
    },

    // TODO: In d3 these are CurveFactory types, not strings
    curveBasis: 'basis',
    curveBasisClosed: 'basisClosed',
    curveBasisOpen: 'basisOpen',
    curveBumpX: 'bumpX',
    curveBumpY: 'bumpY',
    curveBundle: 'bundle',
    curveCardinalClosed: 'cardinalClosed',
    curveCardinalOpen: 'cardinalOpen',
    curveCardinal: 'cardinal',
    curveCatmullRomClosed: 'catmullRomClosed',
    curveCatmullRomOpen: 'catmullRomOpen',
    curveCatmullRom: 'catmullRom',
    curveLinear: 'linear',
    curveLinearClosed: 'linearClosed',
    curveMonotoneX: 'monotoneX',
    curveMonotoneY: 'monotoneY',
    curveNatural: 'natural',
    curveStep: 'step',
    curveStepAfter: 'stepAfter',
    curveStepBefore: 'stepBefore',
  };
});
// -------------------------------

addDiagrams();

describe('UseCase diagram with Chevrotain parser', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('when parsing basic actors', () => {
    it('should parse a single actor', async () => {
      const diagram = await Diagram.fromText(
        `usecase-beta
        actor User`
      );

      expect(diagram).toBeDefined();
      expect(diagram.type).toBe('usecase');

      const actors = db.getActors();
      expect(actors.size).toBe(1);
      expect(actors.has('User')).toBe(true);
      expect(actors.get('User')?.label).toBe('User');
    });

    it('should parse multiple actors', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        actor Admin
        actor Guest`
      );

      const actors = db.getActors();
      expect(actors.size).toBe(3);
      expect(actors.has('User')).toBe(true);
      expect(actors.has('Admin')).toBe(true);
      expect(actors.has('Guest')).toBe(true);
    });

    it('should parse actor with simple name', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor SystemUser`
      );

      const actors = db.getActors();
      expect(actors.size).toBe(1);
      expect(actors.has('SystemUser')).toBe(true);
    });
  });

  describe('when parsing use cases', () => {
    it('should parse use cases from relationships', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        User --> Login`
      );

      const useCases = db.getUseCases();
      expect(useCases.size).toBe(1);
      expect(useCases.has('Login')).toBe(true);
    });

    it('should parse multiple use cases from relationships', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        User --> Login
        User --> Logout
        User --> Register`
      );

      const useCases = db.getUseCases();
      expect(useCases.size).toBe(3);
      expect(useCases.has('Login')).toBe(true);
      expect(useCases.has('Logout')).toBe(true);
      expect(useCases.has('Register')).toBe(true);
    });

    it('should parse use case from relationship', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        User --> UserLoginProcess`
      );

      const useCases = db.getUseCases();
      expect(useCases.size).toBe(1);
      expect(useCases.has('UserLoginProcess')).toBe(true);
    });

    it('should parse use cases with quoted names', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor "Customer Service"
        actor "System Administrator"
        "Customer Service" --> "Handle Tickets"
        "System Administrator" --> "Manage System"`
      );

      const actors = db.getActors();
      expect(actors.size).toBe(2);
      // IDs are generated with underscores replacing spaces
      expect(actors.has('Customer_Service')).toBe(true);
      expect(actors.has('System_Administrator')).toBe(true);
      // But names should preserve the original text
      expect(actors.get('Customer_Service')?.label).toBe('Customer Service');
      expect(actors.get('System_Administrator')?.label).toBe('System Administrator');

      const useCases = db.getUseCases();
      expect(useCases.size).toBe(2);
      expect(useCases.has('Handle_Tickets')).toBe(true);
      expect(useCases.has('Manage_System')).toBe(true);
      expect(useCases.get('Handle_Tickets')?.label).toBe('Handle Tickets');
      expect(useCases.get('Manage_System')?.label).toBe('Manage System');
    });
  });

  describe('when parsing relationships', () => {
    it('should parse actor to use case relationship', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        User --> Login`
      );

      const relationships = db.getRelationships();
      expect(relationships.length).toBe(1);
      expect(relationships[0].source).toBe('User');
      expect(relationships[0].target).toBe('Login');
      expect(relationships[0].type).toBe('association');
    });

    it('should parse multiple relationships', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        User --> Login
        User --> Logout`
      );

      const relationships = db.getRelationships();
      expect(relationships.length).toBe(2);
      expect(relationships[0].source).toBe('User');
      expect(relationships[0].target).toBe('Login');
      expect(relationships[1].source).toBe('User');
      expect(relationships[1].target).toBe('Logout');
    });

    it('should parse relationship with label', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor Developer
        Developer --important--> WriteCode`
      );

      const relationships = db.getRelationships();
      expect(relationships.length).toBe(1);
      expect(relationships[0].label).toBe('important');
    });

    it('should parse different arrow types', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        actor Admin
        User --> Login
        Admin <-- Logout
        User -- ViewData`
      );

      const relationships = db.getRelationships();
      expect(relationships.length).toBe(3);
    });
  });

  describe('when parsing system boundaries', () => {
    it('should parse a system boundary', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor Admin, User
        systemBoundary "Authentication"
          Login
          Logout
        end
        Admin --> Login
        User --> Login`
      );

      const boundaries = db.getSystemBoundaries();
      expect(boundaries.size).toBeGreaterThan(0);
    });

    it('should parse use cases within system boundary', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        systemBoundary "Authentication System"
          Login
          Logout
        end
        User --> Login`
      );

      const useCases = db.getUseCases();
      expect(useCases.size).toBe(2);
      expect(useCases.has('Login')).toBe(true);
      expect(useCases.has('Logout')).toBe(true);
    });

    it('should parse a boundary with an explicit id, a label, and inline metadata', async () => {
      await Diagram.fromText(
        `usecase-beta
        systemBoundary sb1["Payment service"]@{ type: package }
          actor Clerk("Payment clerk")
          Authorize("Authorize payment")
        end
        Clerk --> Authorize`
      );

      expect(db.getSystemBoundary('sb1')).toMatchObject({
        label: 'Payment service',
        type: 'package',
        members: ['Clerk', 'Authorize'],
      });
    });
  });

  describe('when parsing direction', () => {
    it('should handle TB direction', async () => {
      await Diagram.fromText(
        `usecase-beta
        direction TB
        actor User`
      );

      expect(db.getDirection()).toBe('TB');
    });

    it('should handle LR direction', async () => {
      await Diagram.fromText(
        `usecase-beta
        direction LR
        actor User`
      );

      expect(db.getDirection()).toBe('LR');
    });

    it('should normalize TD to TB', async () => {
      await Diagram.fromText(
        `usecase-beta
        direction TD
        actor User`
      );

      expect(db.getDirection()).toBe('TB');
    });
  });

  describe('when parsing actor metadata', () => {
    it('should parse actor with metadata', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User@{ "type" : "normal", "icon" : "user" }
        User --> Login`
      );

      const actors = db.getActors();
      expect(actors.size).toBe(1);
      const user = actors.get('User');
      expect(user).toBeDefined();
      expect(user).toMatchObject({ type: 'icon', icon: 'user', business: false });
    });

    it('should parse multiple actors with different metadata', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User@{ "icon" : "user" }
        actor Admin@{ "type" : "hollow" }
        User --> Login
        Admin --> ManageUsers`
      );

      const actors = db.getActors();
      expect(actors.size).toBe(2);
      expect(actors.get('User')).toMatchObject({ type: 'icon', icon: 'user' });
      expect(actors.get('Admin')).toMatchObject({ type: 'hollow', business: false });
    });
  });

  describe('when parsing complex diagrams', () => {
    it('should parse a complete authentication system', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        actor Admin

        systemBoundary "Authentication System"
          Login
          Logout
          Register
          ResetPassword
        end

        User --> Login
        User --> Register
        User --> Logout
        Admin --> Login`
      );

      const actors = db.getActors();
      const useCases = db.getUseCases();
      const relationships = db.getRelationships();

      expect(actors.size).toBe(2);
      expect(useCases.size).toBe(4);
      expect(relationships.length).toBe(4);
    });

    it('should parse diagram with multiple arrow types', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        actor Admin
        User --> Login
        Admin <-- Logout
        User -- ViewData`
      );

      const relationships = db.getRelationships();
      expect(relationships.length).toBe(3);
    });

    it('should handle use case creation from relationships', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor Developer
        Developer --> LoginSystem
        Developer --> Authentication`
      );

      const useCases = db.getUseCases();
      expect(useCases.size).toBe(2);
      expect(useCases.has('LoginSystem')).toBe(true);
      expect(useCases.has('Authentication')).toBe(true);
    });
  });

  describe('when parsing class definitions', () => {
    it('should handle classDef', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        User --> Login
        classDef important fill:#f96,stroke:#333,stroke-width:4px
        class Login important`
      );

      const classDefs = db.getClassDefs();
      expect(classDefs.size).toBeGreaterThan(0);
    });
  });

  describe('database methods', () => {
    it('should clear all data', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        User --> Login`
      );

      expect(db.getActors().size).toBe(1);
      expect(db.getUseCases().size).toBe(1);
      expect(db.getRelationships().length).toBe(1);

      db.clear();

      expect(db.getActors().size).toBe(0);
      expect(db.getUseCases().size).toBe(0);
      expect(db.getRelationships().length).toBe(0);
    });

    it('should get specific actor by id', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        actor Admin`
      );

      const user = db.getActor('User');
      expect(user).toBeDefined();
      expect(user?.id).toBe('User');
      expect(user?.label).toBe('User');
    });

    it('should get specific use case by id', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        User --> Login
        User --> Logout`
      );

      const login = db.getUseCase('Login');
      expect(login).toBeDefined();
      expect(login?.id).toBe('Login');
      expect(login?.label).toBe('Login');
    });

    it('should return undefined for non-existent actor', () => {
      const actor = db.getActor('NonExistent');
      expect(actor).toBeUndefined();
    });

    it('should return undefined for non-existent use case', () => {
      const useCase = db.getUseCase('NonExistent');
      expect(useCase).toBeUndefined();
    });
  });

  describe('getData method', () => {
    it('should convert diagram data to LayoutData format', async () => {
      await Diagram.fromText(
        `usecase-beta
        actor User
        User --> Login`
      );

      const data = db.getData();

      expect(data).toBeDefined();
      expect(data.nodes).toBeDefined();
      expect(data.edges).toBeDefined();
      expect(data.nodes.length).toBe(2);
      expect(data.edges.length).toBe(1);
      expect(data.type).toBe('usecase');
    });

    it('should include direction in layout data', async () => {
      await Diagram.fromText(
        `usecase-beta
        direction LR
        actor User`
      );

      const data = db.getData();
      expect(data.direction).toBe('LR');
    });
  });

  it('projects parser-produced actor and use-case geometry exactly into AST and LayoutData', async () => {
    await Diagram.fromText(`usecase-beta
actor Normal
actor Hollow@{ type: hollow, business: true }
Business(Business)@{ business: true }
Ellipse
RectCase[Rectangle]`);

    expect(db.getAST()?.nodes).toMatchObject({
      Normal: {
        shape: 'actor',
        attrs: { kind: 'actor', actorType: 'normal', business: false },
      },
      Hollow: {
        shape: 'actor-hollow',
        attrs: { kind: 'actor', actorType: 'hollow', business: true },
      },
      Business: {
        shape: 'ellipse',
        attrs: { kind: 'usecase', useCaseShape: 'ellipse', business: true },
      },
      Ellipse: {
        shape: 'ellipse',
        attrs: { kind: 'usecase', useCaseShape: 'ellipse', business: false },
      },
      RectCase: {
        shape: 'rect',
        attrs: { kind: 'usecase', useCaseShape: 'rect', business: false },
      },
    });

    const nodes = Object.fromEntries(db.getData().nodes.map((node) => [node.id, node]));
    expect(nodes).toMatchObject({
      Normal: { shape: 'usecaseActor', actorType: 'normal', business: false },
      Hollow: { shape: 'usecaseActorHollow', actorType: 'hollow', business: true },
      Business: { shape: 'usecaseBusiness', business: true },
      Ellipse: { shape: 'usecaseEllipse', business: false },
      RectCase: { shape: 'rect', business: false },
    });
  });

  it('projects base, one-extra, N-extra, and labelled minimum lengths from parser to layout', async () => {
    await Diagram.fromText(`usecase-beta
A base@--> B
B two@---> C
C many@-----> D
D labelled@-- "long" ----> E`);

    expect(
      db.getAST()?.edges.map(({ id, label, attrs }) => ({
        id,
        label,
        minlen: attrs?.minlen,
      }))
    ).toEqual([
      { id: 'base', label: undefined, minlen: 1 },
      { id: 'two', label: undefined, minlen: 2 },
      { id: 'many', label: undefined, minlen: 4 },
      { id: 'labelled', label: 'long', minlen: 3 },
    ]);
    expect(db.getData().edges.map(({ id, label, minlen }) => ({ id, label, minlen }))).toEqual([
      { id: 'base', label: undefined, minlen: 1 },
      { id: 'two', label: undefined, minlen: 2 },
      { id: 'many', label: undefined, minlen: 4 },
      { id: 'labelled', label: 'long', minlen: 3 },
    ]);
  });

  it('projects parser-produced animation metadata into exact shared layout classes', async () => {
    await Diagram.fromText(`usecase-beta
A trueEdge@--> B
trueEdge@{ animate: true }
A fastEdge@--> B
fastEdge@{ animation: fast }
A slowEdge@--> B
slowEdge@{ animation: slow }
A offEdge@--> B
offEdge@{ animate: false }`);

    expect(
      db.getData().edges.map(({ id, animate, animation, classes }) => ({
        id,
        animate,
        animation,
        classes,
      }))
    ).toEqual([
      {
        id: 'trueEdge',
        animate: true,
        animation: undefined,
        classes: 'default relationship relationship-association edge-animation-fast',
      },
      {
        id: 'fastEdge',
        animate: true,
        animation: 'fast',
        classes: 'default relationship relationship-association edge-animation-fast',
      },
      {
        id: 'slowEdge',
        animate: true,
        animation: 'slow',
        classes: 'default relationship relationship-association edge-animation-slow',
      },
      {
        id: 'offEdge',
        animate: false,
        animation: undefined,
        classes: 'default relationship relationship-association',
      },
    ]);
  });

  it('projects complex source-ordered JSON, a forward edge, classes, and styles end to end', async () => {
    await Diagram.fromText(`usecase-beta
classDef data fill:#eef,stroke:#369
json Payload@{
  "2": "second",
  "1": "first",
  "colors": ["Red", "Green"],
  "items": [{ "name": "A" }, {}],
  "empty": {},
  "duplicate": "old",
  "duplicate": "new"
}:::data
style Payload stroke-width:4px
Inspect payloadEdge@--> Payload
class payloadEdge data
style payloadEdge stroke:#f00`);

    expect(db.getAST()?.nodes.Payload).toEqual({
      label: 'Payload',
      shape: 'json-table',
      classes: ['data'],
      styles: ['stroke-width:4px'],
      attrs: {
        kind: 'json',
        value: {
          1: 'first',
          2: 'second',
          colors: ['Red', 'Green'],
          items: [{ name: 'A' }, {}],
          empty: {},
          duplicate: 'new',
        },
        propertyOrder: {
          '': ['2', '1', 'colors', 'items', 'empty', 'duplicate'],
          '/items/0': ['name'],
          '/items/1': [],
          '/empty': [],
        },
        labelType: 'text',
      },
    });
    expect(db.getAST()?.edges[0]).toMatchObject({
      id: 'payloadEdge',
      source: 'Inspect',
      target: 'Payload',
      classes: ['data'],
      styles: ['stroke:#f00'],
      attrs: {
        relationshipType: 'association',
        arrowType: ARROW_TYPE.SOLID_ARROW,
        minlen: 1,
        explicitId: true,
      },
    });

    const data = db.getData();
    expect(data.nodes.find(({ id }) => id === 'Payload')).toMatchObject({
      shape: 'usecaseJsonTable',
      cssClasses: 'default usecase-json-table data',
      cssStyles: ['stroke-width:4px'],
      jsonRows: [
        { key: '2', accessibleKey: '2', value: 'second' },
        { key: '1', accessibleKey: '1', value: 'first' },
        { key: 'colors', accessibleKey: 'colors', value: 'Red' },
        { key: '', accessibleKey: 'colors', value: 'Green' },
        { key: 'items[0].name', accessibleKey: 'items[0].name', value: 'A' },
        { key: 'items[1]', accessibleKey: 'items[1]', value: '{}' },
        { key: 'empty', accessibleKey: 'empty', value: '{}' },
        { key: 'duplicate', accessibleKey: 'duplicate', value: 'new' },
      ],
    });
    expect(data.edges[0]).toMatchObject({
      id: 'payloadEdge',
      source: 'Inspect',
      target: 'Payload',
      classes: 'default relationship relationship-association data',
      style: ['stroke:#f00'],
      minlen: 1,
      isUserDefinedId: true,
    });
  });

  describe('P4 LayoutData contract', () => {
    it('emits every node and boundary variant in committed model order', () => {
      const model = db.createModel();
      model.classDefs.set('default', {
        id: 'default',
        styles: ['fill: white', 'stroke: black'],
      });
      model.classDefs.set('first', {
        id: 'first',
        styles: ['fill: red', 'color: blue'],
      });
      model.classDefs.set('second', {
        id: 'second',
        styles: ['stroke: green', 'fill: yellow'],
      });
      model.actors.set('normal', {
        id: 'normal',
        label: '<b>Normal</b>',
        labelType: 'markdown',
        type: 'normal',
        business: true,
        stereotype: 'Human',
        parentId: 'rectBoundary',
        classes: ['first', 'host-only', 'second'],
        styles: ['fill: pink'],
      });
      for (const type of ['hollow', 'awesome'] as const) {
        model.actors.set(type, {
          id: type,
          label: type,
          labelType: 'text',
          type,
          business: false,
          classes: [],
          styles: [],
        });
      }
      model.actors.set('icon', {
        id: 'icon',
        label: 'Icon',
        labelType: 'text',
        type: 'icon',
        icon: 'fa:user',
        business: false,
        classes: [],
        styles: [],
      });
      model.useCases.set('ellipse', {
        id: 'ellipse',
        label: 'Ellipse',
        labelType: 'text',
        shape: 'ellipse',
        business: false,
        parentId: 'packageBoundary',
        classes: [],
        styles: [],
      });
      model.useCases.set('rectangle', {
        id: 'rectangle',
        label: 'Rectangle',
        labelType: 'markdown',
        shape: 'rect',
        business: false,
        stereotype: 'Primary',
        classes: [],
        styles: [],
      });
      model.useCases.set('business', {
        id: 'business',
        label: 'Business',
        labelType: 'text',
        shape: 'ellipse',
        business: true,
        classes: [],
        styles: [],
      });
      model.notes.set('note-0', {
        id: 'note-0',
        target: 'ellipse',
        label: 'Remember',
        labelType: 'text',
      });
      model.jsonNodes.set('Payload', {
        id: 'Payload',
        value: { ok: true },
        propertyOrder: { '': ['ok'] },
        classes: ['host-json'],
        styles: ['stroke-width: 4px'],
      });
      model.systemBoundaries.set('rectBoundary', {
        id: 'rectBoundary',
        label: 'Rectangle system',
        labelType: 'text',
        type: 'rect',
        members: ['normal'],
        classes: [],
        styles: [],
      });
      model.systemBoundaries.set('packageBoundary', {
        id: 'packageBoundary',
        label: 'Package system',
        labelType: 'markdown',
        type: 'package',
        members: ['ellipse'],
        classes: ['host-boundary'],
        styles: ['stroke: purple'],
      });
      db.commit(model);

      const data = db.getData();
      expect(data.nodes.map(({ id }) => id)).toEqual([
        'normal',
        'hollow',
        'awesome',
        'icon',
        'ellipse',
        'rectangle',
        'business',
        'note-0',
        'Payload',
        'rectBoundary',
        'packageBoundary',
      ]);
      expect(data.nodes.map(({ shape }) => shape)).toEqual([
        'usecaseActor',
        'usecaseActorHollow',
        'usecaseActorAwesome',
        'usecaseActorIcon',
        'usecaseEllipse',
        'rect',
        'usecaseBusiness',
        'note',
        'usecaseJsonTable',
        'usecaseSystemBoundary',
        'usecaseSystemBoundary',
      ]);
      expect(data.nodes[0]).toMatchObject({
        label: sanitizeText('<b>Normal</b>', data.config),
        labelType: 'markdown',
        actorType: 'normal',
        business: true,
        stereotype: 'Human',
        parentId: 'rectBoundary',
        cssClasses:
          'default usecase-actor usecase-actor-normal usecase-business first host-only second',
        cssStyles: ['fill: pink'],
        cssCompiledStyles: ['fill: yellow', 'stroke: green', 'color: blue'],
      });
      expect(data.nodes[4]).toMatchObject({ parentId: 'packageBoundary', business: false });
      expect(data.nodes[5]).toMatchObject({ labelType: 'markdown', stereotype: 'Primary' });
      expect(data.nodes[7]).toMatchObject({
        noteTarget: 'ellipse',
        noteTargetLabel: 'Ellipse',
        cssClasses: 'default usecase-note',
      });
      expect(data.nodes[8]).toMatchObject({
        label: 'Payload',
        cssClasses: 'default usecase-json-table host-json',
        cssStyles: ['stroke-width: 4px'],
        jsonRows: [{ key: 'ok', accessibleKey: 'ok', value: 'true' }],
      });
      expect(data.nodes.slice(-2)).toMatchObject([
        { boundaryType: 'rect', cssClasses: 'default system-boundary system-boundary-rect' },
        {
          boundaryType: 'package',
          cssClasses: 'default system-boundary system-boundary-package host-boundary',
          cssStyles: ['stroke: purple'],
        },
      ]);
    });

    it('maps relationship semantics, markers, animation, styles, and note attachments exactly', () => {
      const model = db.createModel();
      for (const id of ['A', 'B']) {
        model.useCases.set(id, {
          id,
          label: `${id} label`,
          labelType: 'text',
          shape: 'ellipse',
          business: false,
          classes: [],
          styles: [],
        });
      }
      model.classDefs.set('default', { id: 'default', styles: ['stroke: gray'] });
      model.classDefs.set('edgeClass', {
        id: 'edgeClass',
        styles: ['stroke: blue', 'stroke-width: 3px'],
      });
      const arrows = [
        ARROW_TYPE.SOLID_ARROW,
        ARROW_TYPE.BACK_ARROW,
        ARROW_TYPE.LINE_SOLID,
        ARROW_TYPE.CIRCLE_ARROW,
        ARROW_TYPE.CROSS_ARROW,
        ARROW_TYPE.CIRCLE_ARROW_REVERSED,
        ARROW_TYPE.CROSS_ARROW_REVERSED,
      ];
      for (const [index, arrowType] of arrows.entries()) {
        model.relationships.push({
          id: `association-${index}`,
          explicitId: index === 0,
          source: 'A',
          target: 'B',
          type: 'association',
          arrowType,
          ...(index === 0 ? { label: 'include this text', labelType: 'text' as const } : {}),
          minlen: index + 1,
          classes: index === 0 ? ['edgeClass', 'host-edge'] : [],
          styles: index === 0 ? ['stroke: red'] : [],
          animate: index === 0,
          ...(index === 0 ? { animation: 'slow' as const } : {}),
        });
      }
      model.relationships.push(
        {
          id: 'include',
          explicitId: true,
          source: 'A',
          target: 'B',
          type: 'include',
          arrowType: ARROW_TYPE.SOLID_ARROW,
          label: 'SHOULD NOT DRIVE SEMANTICS',
          labelType: 'markdown',
          minlen: 1,
          classes: [],
          styles: [],
          animate: false,
        },
        {
          id: 'extend',
          explicitId: true,
          source: 'A',
          target: 'B',
          type: 'extend',
          arrowType: ARROW_TYPE.SOLID_ARROW,
          minlen: 1,
          classes: [],
          styles: [],
          animate: false,
        },
        {
          id: 'generalization',
          explicitId: false,
          source: 'A',
          target: 'B',
          type: 'generalization',
          arrowType: ARROW_TYPE.SOLID_ARROW,
          minlen: 1,
          classes: [],
          styles: [],
          animate: false,
        }
      );
      model.notes.set('note-0', {
        id: 'note-0',
        target: 'A',
        label: 'Attached',
        labelType: 'text',
      });
      db.commit(model);

      const data = db.getData();
      expect(
        data.edges
          .slice(0, 7)
          .map(({ arrowTypeStart, arrowTypeEnd }) => [arrowTypeStart, arrowTypeEnd])
      ).toEqual([
        ['none', 'arrow_point'],
        ['arrow_point', 'none'],
        ['none', 'none'],
        ['none', 'arrow_circle'],
        ['none', 'arrow_cross'],
        ['arrow_circle', 'none'],
        ['arrow_cross', 'none'],
      ]);
      expect(data.edges[0]).toMatchObject({
        id: 'association-0',
        source: 'A',
        target: 'B',
        sourceLabel: 'A label',
        targetLabel: 'B label',
        type: 'edge',
        relationshipType: 'association',
        label: 'include this text',
        pattern: 'solid',
        minlen: 1,
        internal: false,
        classes:
          'default relationship relationship-association edgeClass host-edge edge-animation-slow',
        style: ['stroke: red'],
        cssCompiledStyles: ['stroke: blue', 'stroke-width: 3px'],
        animate: true,
        animation: 'slow',
        isUserDefinedId: true,
      });
      expect(data.edges[7]).toMatchObject({
        id: 'include',
        relationshipType: 'include',
        label: 'include',
        labelType: 'text',
        pattern: 'dotted',
        arrowTypeStart: 'none',
        arrowTypeEnd: 'arrow_point',
      });
      expect(data.edges[8]).toMatchObject({
        id: 'extend',
        relationshipType: 'extend',
        label: 'extend',
        pattern: 'dotted',
        arrowTypeEnd: 'arrow_point',
      });
      expect(data.edges[9]).toMatchObject({
        id: 'generalization',
        relationshipType: 'generalization',
        pattern: 'solid',
        arrowTypeEnd: 'extension',
      });
      expect(data.edges[10]).toMatchObject({
        id: 'note-0-edge',
        source: 'note-0',
        target: 'A',
        sourceLabel: 'Attached',
        targetLabel: 'A label',
        relationshipType: 'note',
        pattern: 'dotted',
        arrowTypeStart: 'none',
        arrowTypeEnd: 'none',
        internal: true,
        minlen: 1,
      });
      expect(data.markers).toEqual(['point', 'circle', 'cross', 'extension']);
    });

    it('flattens JSON rows depth-first using source property order', () => {
      const model = db.createModel();
      model.jsonNodes.set('Payload', {
        id: 'Payload',
        value: {
          1: 'first',
          2: 'second',
          colors: ['Red', 'Green'],
          address: { city: 'Oslo' },
          items: [{ name: 'A' }, {}],
          emptyArray: [],
          emptyObject: {},
          enabled: true,
          count: 2,
          nothing: null,
        },
        propertyOrder: {
          '': [
            '2',
            '1',
            'colors',
            'address',
            'items',
            'emptyArray',
            'emptyObject',
            'enabled',
            'count',
            'nothing',
          ],
          '/address': ['city'],
          '/items/0': ['name'],
          '/items/1': [],
        },
        classes: [],
        styles: [],
      });
      db.commit(model);

      expect(db.getData().nodes[0]).toMatchObject({
        jsonRows: [
          { key: '2', accessibleKey: '2', value: 'second' },
          { key: '1', accessibleKey: '1', value: 'first' },
          { key: 'colors', accessibleKey: 'colors', value: 'Red' },
          { key: '', accessibleKey: 'colors', value: 'Green' },
          { key: 'address.city', accessibleKey: 'address.city', value: 'Oslo' },
          { key: 'items[0].name', accessibleKey: 'items[0].name', value: 'A' },
          { key: 'items[1]', accessibleKey: 'items[1]', value: '{}' },
          { key: 'emptyArray', accessibleKey: 'emptyArray', value: '[]' },
          { key: 'emptyObject', accessibleKey: 'emptyObject', value: '{}' },
          { key: 'enabled', accessibleKey: 'enabled', value: 'true' },
          { key: 'count', accessibleKey: 'count', value: '2' },
          { key: 'nothing', accessibleKey: 'nothing', value: 'null' },
        ],
      });
    });

    it('hands schema-driven layout, viewport, and font configuration to the renderer contract', () => {
      const previous = getConfig().usecase;
      setConfig({
        usecase: {
          actorFontSize: 16,
          actorFontFamily: 'Actor Sans',
          actorFontWeight: '600',
          usecaseFontSize: 13,
          usecaseFontFamily: 'Usecase Serif',
          usecaseFontWeight: '500',
          nodeSpacing: 71,
          rankSpacing: 83,
          diagramPadding: 29,
          useMaxWidth: false,
        },
      });

      try {
        expect(db.getData()).toMatchObject({
          direction: 'LR',
          nodeSpacing: 71,
          rankSpacing: 83,
          diagramPadding: 29,
          useMaxWidth: false,
          actorFontSize: 16,
          actorFontFamily: 'Actor Sans',
          actorFontWeight: '600',
          usecaseFontSize: 13,
          usecaseFontFamily: 'Usecase Serif',
          usecaseFontWeight: '500',
        });
      } finally {
        setConfig({ usecase: previous });
      }
    });

    it('consolidates canonical selectors and relies on shared animation keyframes', () => {
      const css = getStyles({
        actorBkg: '#fff',
        actorBorder: '#111',
        actorTextColor: '#222',
        clusterBkg: '#eee',
        clusterBorder: '#333',
        edgeLabelBackground: '#def',
        fontFamily: 'Open Sans',
        lineColor: '#444',
        mainBkg: '#fff',
        nodeBorder: '#555',
        noteBkgColor: '#ffc',
        noteBorderColor: '#aa9',
        noteTextColor: '#000',
        primaryColor: '#666',
        primaryTextColor: '#111',
        titleColor: '#222',
      });

      expect(css).toContain('.usecase-actor-hollow');
      expect(css).toContain('.usecase-actor-awesome');
      expect(css).toContain('.usecase-business-marker');
      expect(css).toContain('.system-boundary-package');
      expect(css).toContain(
        '& .system-boundary-package-tab {\n    fill: #eee;\n    stroke: #333;\n  }'
      );
      expect(css).not.toContain('& .system-boundary-title,\n  & .system-boundary-package-tab');
      expect(css).toContain('.usecase-note');
      expect(css).toContain('.usecase-json-table');
      expect(css).toContain('.relationship-include');
      expect(css).toContain('& .edgeLabel,\n  & .edgeLabel p {\n    background-color: #def;\n  }');
      expect(css).toContain('& .labelBkg {\n    background-color: #def;\n    padding: 0 2px;\n  }');
      expect(css).toContain('& .edgeLabel .label rect {\n    fill: #def;\n  }');
      expect(css).toContain('.marker.extension');
      expect(css).toContain('var(--mermaid-usecase-actor-font-size, 14px)');
      expect(css).toContain('var(--mermaid-usecase-font-size, 12px)');
      expect(css).not.toContain('@keyframes');
    });
  });
});
