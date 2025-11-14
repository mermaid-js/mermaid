import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { db } from './usecaseDb.js';

beforeAll(async () => {
  // Is required to load the useCase diagram
  await Diagram.fromText('usecase\n actor TestActor');
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

describe('UseCase diagram with ANTLR parser', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('when parsing basic actors', () => {
    it('should parse a single actor', async () => {
      const diagram = await Diagram.fromText(
        `usecase
        actor User`
      );

      expect(diagram).toBeDefined();
      expect(diagram.type).toBe('usecase');

      const actors = db.getActors();
      expect(actors.size).toBe(1);
      expect(actors.has('User')).toBe(true);
      expect(actors.get('User')?.name).toBe('User');
    });

    it('should parse multiple actors', async () => {
      await Diagram.fromText(
        `usecase
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
        `usecase
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
        `usecase
        actor User
        User --> Login`
      );

      const useCases = db.getUseCases();
      expect(useCases.size).toBe(1);
      expect(useCases.has('Login')).toBe(true);
    });

    it('should parse multiple use cases from relationships', async () => {
      await Diagram.fromText(
        `usecase
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
        `usecase
        actor User
        User --> UserLoginProcess`
      );

      const useCases = db.getUseCases();
      expect(useCases.size).toBe(1);
      expect(useCases.has('UserLoginProcess')).toBe(true);
    });

    it('should parse use cases with quoted names', async () => {
      await Diagram.fromText(
        `usecase
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
      expect(actors.get('Customer_Service')?.name).toBe('Customer Service');
      expect(actors.get('System_Administrator')?.name).toBe('System Administrator');

      const useCases = db.getUseCases();
      expect(useCases.size).toBe(2);
      expect(useCases.has('Handle_Tickets')).toBe(true);
      expect(useCases.has('Manage_System')).toBe(true);
      expect(useCases.get('Handle_Tickets')?.name).toBe('Handle Tickets');
      expect(useCases.get('Manage_System')?.name).toBe('Manage System');
    });
  });

  describe('when parsing relationships', () => {
    it('should parse actor to use case relationship', async () => {
      await Diagram.fromText(
        `usecase
        actor User
        User --> Login`
      );

      const relationships = db.getRelationships();
      expect(relationships.length).toBe(1);
      expect(relationships[0].from).toBe('User');
      expect(relationships[0].to).toBe('Login');
      expect(relationships[0].type).toBe('association');
    });

    it('should parse multiple relationships', async () => {
      await Diagram.fromText(
        `usecase
        actor User
        User --> Login
        User --> Logout`
      );

      const relationships = db.getRelationships();
      expect(relationships.length).toBe(2);
      expect(relationships[0].from).toBe('User');
      expect(relationships[0].to).toBe('Login');
      expect(relationships[1].from).toBe('User');
      expect(relationships[1].to).toBe('Logout');
    });

    it('should parse relationship with label', async () => {
      await Diagram.fromText(
        `usecase
        actor Developer
        Developer --important--> WriteCode`
      );

      const relationships = db.getRelationships();
      expect(relationships.length).toBe(1);
      expect(relationships[0].label).toBe('important');
    });

    it('should parse different arrow types', async () => {
      await Diagram.fromText(
        `usecase
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
        `usecase
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
        `usecase
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
  });

  describe('when parsing direction', () => {
    it('should handle TB direction', async () => {
      await Diagram.fromText(
        `usecase
        direction TB
        actor User`
      );

      expect(db.getDirection()).toBe('TB');
    });

    it('should handle LR direction', async () => {
      await Diagram.fromText(
        `usecase
        direction LR
        actor User`
      );

      expect(db.getDirection()).toBe('LR');
    });

    it('should normalize TD to TB', async () => {
      await Diagram.fromText(
        `usecase
        direction TD
        actor User`
      );

      expect(db.getDirection()).toBe('TB');
    });
  });

  describe('when parsing actor metadata', () => {
    it('should parse actor with metadata', async () => {
      await Diagram.fromText(
        `usecase
        actor User@{ "type" : "primary", "icon" : "user" }
        User --> Login`
      );

      const actors = db.getActors();
      expect(actors.size).toBe(1);
      const user = actors.get('User');
      expect(user).toBeDefined();
      expect(user?.metadata).toBeDefined();
    });

    it('should parse multiple actors with different metadata', async () => {
      await Diagram.fromText(
        `usecase
        actor User@{ "type" : "primary", "icon" : "user" }
        actor Admin@{ "type" : "secondary", "icon" : "admin" }
        User --> Login
        Admin --> ManageUsers`
      );

      const actors = db.getActors();
      expect(actors.size).toBe(2);
    });
  });

  describe('when parsing complex diagrams', () => {
    it('should parse a complete authentication system', async () => {
      await Diagram.fromText(
        `usecase
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
        `usecase
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
        `usecase
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
        `usecase
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
        `usecase
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
        `usecase
        actor User
        actor Admin`
      );

      const user = db.getActor('User');
      expect(user).toBeDefined();
      expect(user?.id).toBe('User');
      expect(user?.name).toBe('User');
    });

    it('should get specific use case by id', async () => {
      await Diagram.fromText(
        `usecase
        actor User
        User --> Login
        User --> Logout`
      );

      const login = db.getUseCase('Login');
      expect(login).toBeDefined();
      expect(login?.id).toBe('Login');
      expect(login?.name).toBe('Login');
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
        `usecase
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
        `usecase
        direction LR
        actor User`
      );

      const data = db.getData();
      expect(data.direction).toBe('LR');
    });
  });
});
