import { describe, expect, it } from 'vitest';
import { parseUsecaseWithAntlr, UsecaseParseError } from '../src/language/usecase/index.js';
import { ARROW_TYPE } from '../src/language/usecase/types.js';
import type { UsecaseParseResult } from '../src/language/usecase/types.js';

describe('usecase ANTLR parser', () => {
  const parse = (input: string): UsecaseParseResult => {
    return parseUsecaseWithAntlr(input);
  };

  it('should parse basic usecase diagram with actors', () => {
    const input = `usecase
      actor Developer1
      actor Developer2
      actor Developer3`;

    const result = parse(input);

    expect(result.actors).toHaveLength(3);
    expect(result.actors[0]).toEqual({
      id: 'Developer1',
      name: 'Developer1',
    });
    expect(result.actors[1]).toEqual({
      id: 'Developer2',
      name: 'Developer2',
    });
    expect(result.actors[2]).toEqual({
      id: 'Developer3',
      name: 'Developer3',
    });
    expect(result.useCases).toHaveLength(0);
    expect(result.relationships).toHaveLength(0);
  });

  it('should parse actors with quoted names', () => {
    const input = `usecase
      actor "User Admin"
      actor 'System User'`;

    const result = parse(input);

    expect(result.actors).toHaveLength(2);
    expect(result.actors[0]).toEqual({
      id: 'User Admin',
      name: 'User Admin',
    });
    expect(result.actors[1]).toEqual({
      id: 'System User',
      name: 'System User',
    });
  });

  it('should create use cases implicitly from relationships', () => {
    const input = `usecase
      actor User
      User --> Login
      User --> "Manage Users"
      User --> 'View Reports'`;

    const result = parse(input);

    expect(result.useCases).toHaveLength(3);
    expect(result.useCases[0]).toEqual({
      id: 'Login',
      name: 'Login',
    });
    expect(result.useCases[1]).toEqual({
      id: 'Manage Users',
      name: 'Manage Users',
    });
    expect(result.useCases[2]).toEqual({
      id: 'View Reports',
      name: 'View Reports',
    });
    expect(result.actors).toHaveLength(1);
    expect(result.relationships).toHaveLength(3);
  });

  it('should parse relationships between actors and implicit use cases', () => {
    const input = `usecase
      actor User
      actor Admin
      User --> Login
      Admin --> "Manage System"`;

    const result = parse(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(2);
    expect(result.relationships).toHaveLength(2);

    expect(result.relationships[0]).toEqual({
      id: 'rel_0',
      from: 'User',
      to: 'Login',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
    });
    expect(result.relationships[1]).toEqual({
      id: 'rel_1',
      from: 'Admin',
      to: 'Manage System',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
    });
  });

  it('should parse actor to actor relationships', () => {
    const input = `usecase
      actor User
      actor Admin
      User --> Admin`;

    const result = parse(input);

    expect(result.actors).toHaveLength(2);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0]).toEqual({
      id: 'rel_0',
      from: 'User',
      to: 'Admin',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
    });
  });

  it('should handle empty usecase diagram', () => {
    const input = `usecase`;

    const result = parse(input);

    expect(result.actors).toHaveLength(0);
    expect(result.useCases).toHaveLength(0);
    expect(result.relationships).toHaveLength(0);
  });

  it('should handle usecase diagram with newlines and whitespace', () => {
    const input = `usecase

      actor Developer1

      actor Developer2

      Developer1 --> Login

    `;

    const result = parse(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(1);
    expect(result.relationships).toHaveLength(1);
  });

  it('should handle complex usecase diagram with implicit use cases', () => {
    const input = `usecase
      actor "System Admin"
      actor User
      actor Guest
      User --> "Login System"
      "System Admin" --> "User Management"
      Guest --> "View Content"
      User --> "View Content"`;

    const result = parse(input);

    expect(result.actors).toHaveLength(3);
    expect(result.useCases).toHaveLength(3);
    expect(result.relationships).toHaveLength(4);

    // Verify specific relationships
    const loginRel = result.relationships.find((r) => r.from === 'User' && r.to === 'Login System');
    expect(loginRel).toBeDefined();
    expect(loginRel?.type).toBe('association');
  });
});

describe('Enhanced ANTLR usecase parser features', () => {
  const parse = (input: string): UsecaseParseResult => {
    return parseUsecaseWithAntlr(input);
  };
  test('should handle different arrow types with implicit use cases', () => {
    const input = `usecase
      actor User
      actor Admin
      User --> Login
      Admin <-- Manage
      User -- Login
    `;

    const result = parse(input);
    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(2);
    expect(result.relationships).toHaveLength(3);

    // Check relationships with different arrow types
    expect(result.relationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'User', to: 'Login', type: 'association' }),
        expect.objectContaining({ from: 'Admin', to: 'Manage', type: 'association' }),
        expect.objectContaining({ from: 'User', to: 'Login', type: 'association' }),
      ])
    );
  });

  test('should handle mixed entity types in relationships with implicit use cases', () => {
    const input = `usecase
      actor Manager
      actor Employee
      Manager --> Employee
      Employee --> "Submit Report"
      Manager --> "Submit Report"
    `;

    const result = parse(input);
    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(1);
    expect(result.relationships).toHaveLength(3);

    // Check mixed relationships (actor-to-actor and actor-to-usecase)
    expect(result.relationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'Manager', to: 'Employee', type: 'association' }),
        expect.objectContaining({ from: 'Employee', to: 'Submit Report', type: 'association' }),
        expect.objectContaining({ from: 'Manager', to: 'Submit Report', type: 'association' }),
      ])
    );
  });

  test('should handle comprehensive usecase diagram with implicit use cases', () => {
    const input = `usecase
      actor Customer
      actor "Bank Employee"
      actor "System Admin"
      Customer --> "Withdraw Money"
      Customer --> "Check Balance"
      Customer --> "Transfer Funds"
      "Bank Employee" --> "Check Balance"
      "Bank Employee" --> "Transfer Funds"
      "Bank Employee" --> "Manage Accounts"
      "System Admin" --> "Manage Accounts"
    `;

    const result = parse(input);
    expect(result.actors).toHaveLength(3);
    expect(result.useCases).toHaveLength(4);
    expect(result.relationships).toHaveLength(7);

    // Check actors
    expect(result.actors).toEqual(
      expect.arrayContaining([
        { id: 'Customer', name: 'Customer' },
        { id: 'Bank Employee', name: 'Bank Employee' },
        { id: 'System Admin', name: 'System Admin' },
      ])
    );

    // Check use cases
    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'Withdraw Money', name: 'Withdraw Money' },
        { id: 'Check Balance', name: 'Check Balance' },
        { id: 'Transfer Funds', name: 'Transfer Funds' },
        { id: 'Manage Accounts', name: 'Manage Accounts' },
      ])
    );

    // Check relationships
    expect(result.relationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'Customer', to: 'Withdraw Money', type: 'association' }),
        expect.objectContaining({ from: 'Customer', to: 'Check Balance', type: 'association' }),
        expect.objectContaining({ from: 'Customer', to: 'Transfer Funds', type: 'association' }),
        expect.objectContaining({
          from: 'Bank Employee',
          to: 'Check Balance',
          type: 'association',
        }),
        expect.objectContaining({
          from: 'Bank Employee',
          to: 'Transfer Funds',
          type: 'association',
        }),
        expect.objectContaining({
          from: 'Bank Employee',
          to: 'Manage Accounts',
          type: 'association',
        }),
        expect.objectContaining({
          from: 'System Admin',
          to: 'Manage Accounts',
          type: 'association',
        }),
      ])
    );
  });
});

describe('Comma-separated actor syntax', () => {
  it('should parse comma-separated actors', () => {
    const input = `usecase
actor Developer1, Developer2, Developer3`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(3);
    expect(result.actors).toEqual([
      { id: 'Developer1', name: 'Developer1' },
      { id: 'Developer2', name: 'Developer2' },
      { id: 'Developer3', name: 'Developer3' },
    ]);
  });

  it('should parse quoted names with commas', () => {
    const input = `usecase
actor "User Admin", "System Admin", "Database Admin"`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(3);
    expect(result.actors).toEqual([
      { id: 'User Admin', name: 'User Admin' },
      { id: 'System Admin', name: 'System Admin' },
      { id: 'Database Admin', name: 'Database Admin' },
    ]);
  });

  it('should handle mixed single and comma-separated actors', () => {
    const input = `usecase
actor SingleActor
actor Group1, Group2, Group3
actor AnotherSingle`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(5);
    expect(result.actors).toEqual([
      { id: 'SingleActor', name: 'SingleActor' },
      { id: 'Group1', name: 'Group1' },
      { id: 'Group2', name: 'Group2' },
      { id: 'Group3', name: 'Group3' },
      { id: 'AnotherSingle', name: 'AnotherSingle' },
    ]);
  });

  it('should handle comma-separated actors with implicit use cases from relationships', () => {
    const input = `usecase
actor User, Admin, Guest
User --> Login
Admin --> Login
Guest --> Login
User --> Logout
Admin --> Logout`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(3);
    expect(result.useCases).toHaveLength(2);
    expect(result.relationships).toHaveLength(5);

    expect(result.actors).toEqual([
      { id: 'User', name: 'User' },
      { id: 'Admin', name: 'Admin' },
      { id: 'Guest', name: 'Guest' },
    ]);

    expect(result.useCases).toEqual([
      { id: 'Login', name: 'Login' },
      { id: 'Logout', name: 'Logout' },
    ]);
  });

  it('should maintain backward compatibility with original syntax', () => {
    const input = `usecase
actor Developer1
actor Developer2
actor Developer3`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(3);
    expect(result.actors).toEqual([
      { id: 'Developer1', name: 'Developer1' },
      { id: 'Developer2', name: 'Developer2' },
      { id: 'Developer3', name: 'Developer3' },
    ]);
  });

  it('should handle single actor in comma syntax', () => {
    const input = `usecase
actor SingleActor`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(1);
    expect(result.actors).toEqual([{ id: 'SingleActor', name: 'SingleActor' }]);
  });

  it('should handle complex comma-separated scenario with implicit use cases', () => {
    const input = `usecase
      actor "Customer Service", "Technical Support", "Sales Team"
      actor SystemAdmin
      "Customer Service" --> "Handle Tickets"
      "Technical Support" --> "Handle Tickets"
      "Sales Team" --> "Process Orders"
      SystemAdmin --> "Handle Tickets"
      SystemAdmin --> "Process Orders"
`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(4);
    expect(result.useCases).toHaveLength(2);
    expect(result.relationships).toHaveLength(5);

    expect(result.actors).toEqual(
      expect.arrayContaining([
        { id: 'Customer Service', name: 'Customer Service' },
        { id: 'Technical Support', name: 'Technical Support' },
        { id: 'Sales Team', name: 'Sales Team' },
        { id: 'SystemAdmin', name: 'SystemAdmin' },
      ])
    );
  });
});

describe('Actor metadata syntax', () => {
  it('should parse actor with metadata', () => {
    const input = `usecase
actor Developer1@{ "icon" : "icon_name", "type" : "hollow", "name": "Sample Name"  }`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(1);
    expect(result.actors[0]).toEqual({
      id: 'Developer1',
      name: 'Developer1',
      metadata: {
        icon: 'icon_name',
        type: 'hollow',
        name: 'Sample Name',
      },
    });
  });

  it('should parse simple metadata', () => {
    const input = `usecase
actor User@{ "role" : "admin" }`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(1);
    expect(result.actors[0]).toEqual({
      id: 'User',
      name: 'User',
      metadata: {
        role: 'admin',
      },
    });
  });

  it('should parse comma-separated actors with metadata', () => {
    const input = `usecase
actor Admin@{ "role" : "admin" }, User@{ "role" : "user" }`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.actors).toEqual([
      {
        id: 'Admin',
        name: 'Admin',
        metadata: { role: 'admin' },
      },
      {
        id: 'User',
        name: 'User',
        metadata: { role: 'user' },
      },
    ]);
  });

  it('should handle mixed actors with and without metadata', () => {
    const input = `usecase
actor SimpleActor, MetaActor@{ "type" : "special" }`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.actors).toEqual([
      {
        id: 'SimpleActor',
        name: 'SimpleActor',
        metadata: undefined,
      },
      {
        id: 'MetaActor',
        name: 'MetaActor',
        metadata: { type: 'special' },
      },
    ]);
  });

  it('should handle quoted actor names with metadata', () => {
    const input = `usecase
actor "System Admin"@{ "level" : "high", "department" : "IT" }`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(1);
    expect(result.actors[0]).toEqual({
      id: 'System Admin',
      name: 'System Admin',
      metadata: {
        level: 'high',
        department: 'IT',
      },
    });
  });

  it('should handle metadata with relationships and implicit use cases', () => {
    const input = `usecase
actor Admin@{ "role" : "admin" }, User@{ "role" : "user" }
Admin --> Login
User --> Login`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(1);
    expect(result.relationships).toHaveLength(2);

    expect(result.actors).toEqual([
      {
        id: 'Admin',
        name: 'Admin',
        metadata: { role: 'admin' },
      },
      {
        id: 'User',
        name: 'User',
        metadata: { role: 'user' },
      },
    ]);

    expect(result.useCases).toEqual([{ id: 'Login', name: 'Login' }]);
  });

  it('should maintain backward compatibility without metadata', () => {
    const input = `usecase
actor Developer1, Developer2, Developer3`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(3);
    expect(result.actors).toEqual([
      { id: 'Developer1', name: 'Developer1', metadata: undefined },
      { id: 'Developer2', name: 'Developer2', metadata: undefined },
      { id: 'Developer3', name: 'Developer3', metadata: undefined },
    ]);
  });

  it('should handle complex metadata scenario with implicit use cases', () => {
    const input = `usecase
actor "Customer Service"@{ "icon" : "user", "type" : "primary" }, "Technical Support"@{ "icon" : "wrench", "type" : "secondary" }
actor SystemAdmin@{ "role" : "admin", "level" : "high" }
"Customer Service" --> "Handle Tickets"
"Technical Support" --> "Handle Tickets"
SystemAdmin --> "Handle Tickets"
SystemAdmin --> "Process Orders"`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(3);
    expect(result.useCases).toHaveLength(2);
    expect(result.relationships).toHaveLength(4);

    expect(result.actors).toEqual(
      expect.arrayContaining([
        {
          id: 'Customer Service',
          name: 'Customer Service',
          metadata: { icon: 'user', type: 'primary' },
        },
        {
          id: 'Technical Support',
          name: 'Technical Support',
          metadata: { icon: 'wrench', type: 'secondary' },
        },
        {
          id: 'SystemAdmin',
          name: 'SystemAdmin',
          metadata: { role: 'admin', level: 'high' },
        },
      ])
    );

    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'Handle Tickets', name: 'Handle Tickets' },
        { id: 'Process Orders', name: 'Process Orders' },
      ])
    );
  });
});

describe('Implicit use case creation', () => {
  it('should create use cases implicitly from relationships', () => {
    const input = `usecase
actor developer1
actor developer2
developer1 --> Login
developer2 --> "Handle Tickets"
developer1 --> "System Maintenance"`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(3);
    expect(result.relationships).toHaveLength(3);

    expect(result.actors).toEqual([
      { id: 'developer1', name: 'developer1', metadata: undefined },
      { id: 'developer2', name: 'developer2', metadata: undefined },
    ]);

    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'Login', name: 'Login' },
        { id: 'Handle Tickets', name: 'Handle Tickets' },
        { id: 'System Maintenance', name: 'System Maintenance' },
      ])
    );
  });

  it('should not create use cases for actor-to-actor relationships', () => {
    const input = `usecase
actor Manager, Developer
Manager --> Developer`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(0);
    expect(result.relationships).toHaveLength(1);

    expect(result.actors).toEqual([
      { id: 'Manager', name: 'Manager', metadata: undefined },
      { id: 'Developer', name: 'Developer', metadata: undefined },
    ]);
  });

  it('should handle mixed actor-to-usecase and actor-to-actor relationships', () => {
    const input = `usecase
actor Manager, Developer, Tester
Manager --> Developer
Developer --> "Code Review"
Tester --> "Testing"
Manager --> "Project Planning"`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(3);
    expect(result.useCases).toHaveLength(3);
    expect(result.relationships).toHaveLength(4);

    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'Code Review', name: 'Code Review' },
        { id: 'Testing', name: 'Testing' },
        { id: 'Project Planning', name: 'Project Planning' },
      ])
    );
  });
});

describe('System Boundary functionality', () => {
  it('should parse basic system boundary syntax', () => {
    const input = `usecase
actor Developer
actor Tester
systemBoundary Tasks
  coding
  testing
end
Developer --> coding
Tester --> testing`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(2);
    expect(result.systemBoundaries).toHaveLength(1);
    expect(result.relationships).toHaveLength(2);

    expect(result.actors).toEqual([
      { id: 'Developer', name: 'Developer', metadata: undefined },
      { id: 'Tester', name: 'Tester', metadata: undefined },
    ]);

    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'coding', name: 'coding', systemBoundary: 'Tasks' },
        { id: 'testing', name: 'testing', systemBoundary: 'Tasks' },
      ])
    );

    expect(result.systemBoundaries).toEqual([
      { id: 'Tasks', name: 'Tasks', useCases: ['coding', 'testing'], type: 'rect' },
    ]);
  });

  it('should handle system boundary with quoted names', () => {
    const input = `usecase
actor User
systemBoundary "User Management"
  "Create User"
  "Delete User"
  "Update Profile"
end
User --> "Create User"
User --> "Update Profile"`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(1);
    expect(result.useCases).toHaveLength(3);
    expect(result.systemBoundaries).toHaveLength(1);
    expect(result.relationships).toHaveLength(2);

    expect(result.systemBoundaries).toEqual([
      {
        id: 'User Management',
        name: 'User Management',
        useCases: ['Create User', 'Delete User', 'Update Profile'],
        type: 'rect',
      },
    ]);

    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'Create User', name: 'Create User', systemBoundary: 'User Management' },
        { id: 'Delete User', name: 'Delete User', systemBoundary: 'User Management' },
        { id: 'Update Profile', name: 'Update Profile', systemBoundary: 'User Management' },
      ])
    );
  });

  it('should handle multiple system boundaries', () => {
    const input = `usecase
actor Admin, User
systemBoundary Authentication
  Login
  Logout
end
systemBoundary "User Management"
  "Manage Users"
  "View Reports"
end
Admin --> Login
User --> Login
Admin --> "Manage Users"
User --> "View Reports"`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(4);
    expect(result.systemBoundaries).toHaveLength(2);
    expect(result.relationships).toHaveLength(4);

    expect(result.systemBoundaries).toEqual(
      expect.arrayContaining([
        {
          id: 'Authentication',
          name: 'Authentication',
          useCases: ['Login', 'Logout'],
          type: 'rect',
        },
        {
          id: 'User Management',
          name: 'User Management',
          useCases: ['Manage Users', 'View Reports'],
          type: 'rect',
        },
      ])
    );
  });

  it('should handle system boundary with actors having metadata', () => {
    const input = `usecase
actor Admin@{ "icon" : "admin" }, User@{ "icon" : "user" }
systemBoundary "Core Features"
  Login
  Dashboard
end
Admin --> Login
User --> Dashboard`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(2);
    expect(result.systemBoundaries).toHaveLength(1);
    expect(result.relationships).toHaveLength(2);

    expect(result.actors).toEqual(
      expect.arrayContaining([
        { id: 'Admin', name: 'Admin', metadata: { icon: 'admin' } },
        { id: 'User', name: 'User', metadata: { icon: 'user' } },
      ])
    );

    expect(result.systemBoundaries).toEqual([
      {
        id: 'Core Features',
        name: 'Core Features',
        useCases: ['Login', 'Dashboard'],
        type: 'rect',
      },
    ]);
  });

  it('should handle mixed use cases (some in boundaries, some not)', () => {
    const input = `usecase
actor Developer, Manager
systemBoundary "Development Tasks"
  coding
  testing
end
Developer --> coding
Developer --> testing
Manager --> "Project Planning"
Developer --> "Code Review"`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(4);
    expect(result.systemBoundaries).toHaveLength(1);
    expect(result.relationships).toHaveLength(4);

    // Use cases in boundary should have systemBoundary property
    const codingUseCase = result.useCases.find((uc) => uc.id === 'coding');
    const testingUseCase = result.useCases.find((uc) => uc.id === 'testing');
    expect(codingUseCase?.systemBoundary).toBe('Development Tasks');
    expect(testingUseCase?.systemBoundary).toBe('Development Tasks');

    // Use cases not in boundary should not have systemBoundary property
    const planningUseCase = result.useCases.find((uc) => uc.id === 'Project Planning');
    const reviewUseCase = result.useCases.find((uc) => uc.id === 'Code Review');
    expect(planningUseCase?.systemBoundary).toBeUndefined();
    expect(reviewUseCase?.systemBoundary).toBeUndefined();
  });

  it('should handle empty system boundary', () => {
    const input = `usecase
actor Developer
systemBoundary EmptyBoundary
end
Developer --> "Some Task"`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(1);
    expect(result.useCases).toHaveLength(1);
    expect(result.systemBoundaries).toHaveLength(1);
    expect(result.relationships).toHaveLength(1);

    expect(result.systemBoundaries).toEqual([
      { id: 'EmptyBoundary', name: 'EmptyBoundary', useCases: [], type: 'rect' },
    ]);

    // Use case created from relationship should not be in boundary
    const someTaskUseCase = result.useCases.find((uc) => uc.id === 'Some Task');
    expect(someTaskUseCase?.systemBoundary).toBeUndefined();
  });
});

describe('System Boundary Type Configuration', () => {
  it('should parse system boundary with package type', () => {
    const input = `usecase
actor Developer1
systemBoundary Tasks
  coding
end
Tasks@{ type: package }
Developer1 --> coding`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(1);
    expect(result.useCases).toHaveLength(1);
    expect(result.systemBoundaries).toHaveLength(1);
    expect(result.relationships).toHaveLength(1);

    expect(result.systemBoundaries[0]).toEqual({
      id: 'Tasks',
      name: 'Tasks',
      useCases: ['coding'],
      type: 'package',
    });
  });

  it('should parse system boundary with rect type', () => {
    const input = `usecase
actor Developer1
systemBoundary Tasks
  coding
end
Tasks@{ type: rect }
Developer1 --> coding`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.systemBoundaries[0]).toEqual({
      id: 'Tasks',
      name: 'Tasks',
      useCases: ['coding'],
      type: 'rect',
    });
  });

  it('should default to rect type when no type specified', () => {
    const input = `usecase
actor Developer1
systemBoundary Tasks
  coding
end
Developer1 --> coding`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.systemBoundaries[0]).toEqual({
      id: 'Tasks',
      name: 'Tasks',
      useCases: ['coding'],
      type: 'rect', // Should default to rect
    });
  });

  it('should handle multiple boundaries with different types', () => {
    const input = `usecase
actor Admin, User
systemBoundary Authentication
  Login
  Logout
end
systemBoundary "User Management"
  "Manage Users"
  "View Reports"
end
Authentication@{ type: package }
"User Management"@{ type: rect }
Admin --> Login
User --> "Manage Users"`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.systemBoundaries).toHaveLength(2);

    const authBoundary = result.systemBoundaries.find((b) => b.id === 'Authentication');
    const userManagementBoundary = result.systemBoundaries.find((b) => b.id === 'User Management');

    expect(authBoundary).toEqual({
      id: 'Authentication',
      name: 'Authentication',
      useCases: ['Login', 'Logout'],
      type: 'package',
    });

    expect(userManagementBoundary).toEqual({
      id: 'User Management',
      name: 'User Management',
      useCases: ['Manage Users', 'View Reports'],
      type: 'rect',
    });
  });

  it('should handle quoted boundary names with type configuration', () => {
    const input = `usecase
actor User
systemBoundary "Core Features"
  Login
  Dashboard
end
"Core Features"@{ type: package }
User --> Login`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.systemBoundaries[0]).toEqual({
      id: 'Core Features',
      name: 'Core Features',
      useCases: ['Login', 'Dashboard'],
      type: 'package',
    });
  });

  it('should work with actor metadata and system boundary types', () => {
    const input = `usecase
actor Admin@{ "icon" : "admin" }, User@{ "icon" : "user" }
systemBoundary "Core System"
  Login
  Dashboard
end
"Core System"@{ type: package }
Admin --> Login
User --> Dashboard`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.systemBoundaries).toHaveLength(1);
    expect(result.relationships).toHaveLength(2);

    expect(result.actors).toEqual(
      expect.arrayContaining([
        { id: 'Admin', name: 'Admin', metadata: { icon: 'admin' } },
        { id: 'User', name: 'User', metadata: { icon: 'user' } },
      ])
    );

    expect(result.systemBoundaries[0]).toEqual({
      id: 'Core System',
      name: 'Core System',
      useCases: ['Login', 'Dashboard'],
      type: 'package',
    });
  });

  it('should maintain backward compatibility with existing system boundaries', () => {
    const input = `usecase
actor Developer, Tester
systemBoundary Tasks
  coding
  testing
end
Developer --> coding
Tester --> testing`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.systemBoundaries[0]).toEqual({
      id: 'Tasks',
      name: 'Tasks',
      useCases: ['coding', 'testing'],
      type: 'rect', // Should default to rect for backward compatibility
    });
  });
});

describe('Node ID with Label Syntax', () => {
  it('should parse basic node ID with label syntax', () => {
    const input = `usecase
actor Developer1
Developer1 --> a(Go through code)`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(1);
    expect(result.useCases).toHaveLength(1);
    expect(result.relationships).toHaveLength(1);

    expect(result.actors[0]).toEqual({
      id: 'Developer1',
      name: 'Developer1',
      metadata: undefined,
    });

    expect(result.useCases[0]).toEqual({
      id: 'Go through code',
      name: 'Go through code',
      nodeId: 'a',
    });

    expect(result.relationships[0]).toEqual({
      id: 'rel_0',
      from: 'Developer1',
      to: 'Go through code',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
    });
  });

  it('should parse your exact requested syntax', () => {
    const input = `usecase
actor Developer1
actor Developer2
Developer1 --> a(Go through code)
Developer2 --> b(Go through implementation)
actor tester --> c(Go through testing)`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(3);
    expect(result.useCases).toHaveLength(3);
    expect(result.relationships).toHaveLength(3);

    // Check actors
    expect(result.actors).toEqual(
      expect.arrayContaining([
        { id: 'Developer1', name: 'Developer1', metadata: undefined },
        { id: 'Developer2', name: 'Developer2', metadata: undefined },
        { id: 'tester', name: 'tester', metadata: undefined },
      ])
    );

    // Check use cases with node IDs
    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'Go through code', name: 'Go through code', nodeId: 'a' },
        { id: 'Go through implementation', name: 'Go through implementation', nodeId: 'b' },
        { id: 'Go through testing', name: 'Go through testing', nodeId: 'c' },
      ])
    );

    // Check relationships
    expect(result.relationships).toHaveLength(3);
    expect(result.relationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'Developer1', to: 'Go through code' }),
        expect.objectContaining({ from: 'Developer2', to: 'Go through implementation' }),
        expect.objectContaining({ from: 'tester', to: 'Go through testing' }),
      ])
    );
  });

  it('should handle quoted labels in node ID syntax', () => {
    const input = `usecase
actor Admin
Admin --> x("Create User")
Admin --> y("Delete User")`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(1);
    expect(result.useCases).toHaveLength(2);
    expect(result.relationships).toHaveLength(2);

    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'Create User', name: 'Create User', nodeId: 'x' },
        { id: 'Delete User', name: 'Delete User', nodeId: 'y' },
      ])
    );
  });

  it('should handle multi-word labels in node ID syntax', () => {
    const input = `usecase
actor Developer
Developer --> task1(Review code changes)
Developer --> task2(Run unit tests)`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(1);
    expect(result.useCases).toHaveLength(2);
    expect(result.relationships).toHaveLength(2);

    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'Review code changes', name: 'Review code changes', nodeId: 'task1' },
        { id: 'Run unit tests', name: 'Run unit tests', nodeId: 'task2' },
      ])
    );
  });

  it('should handle inline actor declarations with node ID syntax', () => {
    const input = `usecase
actor Developer1
actor tester --> c(Go through testing)
Developer1 --> a(Go through code)`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(2);
    expect(result.relationships).toHaveLength(2);

    // Both actors should be created (one explicit, one inline)
    expect(result.actors).toEqual(
      expect.arrayContaining([
        { id: 'Developer1', name: 'Developer1', metadata: undefined },
        { id: 'tester', name: 'tester', metadata: undefined },
      ])
    );

    // Use cases should have node IDs
    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'Go through testing', name: 'Go through testing', nodeId: 'c' },
        { id: 'Go through code', name: 'Go through code', nodeId: 'a' },
      ])
    );
  });

  it('should maintain backward compatibility with regular syntax', () => {
    const input = `usecase
actor Developer1
actor Developer2
Developer1 --> "Regular Use Case"
Developer2 --> a(Node ID Use Case)`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(2);
    expect(result.relationships).toHaveLength(2);

    // Regular use case without node ID
    const regularUseCase = result.useCases.find((uc) => uc.id === 'Regular Use Case');
    expect(regularUseCase).toEqual({
      id: 'Regular Use Case',
      name: 'Regular Use Case',
      nodeId: undefined,
    });

    // Use case with node ID
    const nodeIdUseCase = result.useCases.find((uc) => uc.id === 'Node ID Use Case');
    expect(nodeIdUseCase).toEqual({
      id: 'Node ID Use Case',
      name: 'Node ID Use Case',
      nodeId: 'a',
    });
  });

  it('should work with actor metadata and node ID syntax', () => {
    const input = `usecase
actor Admin@{ "icon" : "admin" }
actor User@{ "icon" : "user" }
Admin --> x(Create User)
User --> y(View Profile)`;

    const result = parseUsecaseWithAntlr(input);

    expect(result.actors).toHaveLength(2);
    expect(result.useCases).toHaveLength(2);
    expect(result.relationships).toHaveLength(2);

    expect(result.actors).toEqual(
      expect.arrayContaining([
        { id: 'Admin', name: 'Admin', metadata: { icon: 'admin' } },
        { id: 'User', name: 'User', metadata: { icon: 'user' } },
      ])
    );

    expect(result.useCases).toEqual(
      expect.arrayContaining([
        { id: 'Create User', name: 'Create User', nodeId: 'x' },
        { id: 'View Profile', name: 'View Profile', nodeId: 'y' },
      ])
    );
  });
});

describe('Edge Label Syntax', () => {
  const parse = (input: string): UsecaseParseResult => {
    return parseUsecaseWithAntlr(input);
  };

  it('should parse basic edge label syntax', () => {
    const input = `usecase
actor Developer1
Developer1 --important--> a(coding)`;

    const result = parse(input);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0]).toEqual({
      id: 'rel_0',
      from: 'Developer1',
      to: 'coding',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: 'important',
    });
  });

  it('should parse your exact requested syntax', () => {
    const input = `usecase
  actor Developer1
  Developer1 --important--> a(coding)`;

    const result = parse(input);
    expect(result.actors).toHaveLength(1);
    expect(result.actors[0]).toEqual({
      id: 'Developer1',
      name: 'Developer1',
    });
    expect(result.useCases).toHaveLength(1);
    expect(result.useCases[0]).toEqual({
      id: 'coding',
      name: 'coding',
      nodeId: 'a',
    });
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0]).toEqual({
      id: 'rel_0',
      from: 'Developer1',
      to: 'coding',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: 'important',
    });
  });

  it('should parse edge labels with string values', () => {
    const input = `usecase
actor User
User --"very important"--> Login`;

    const result = parse(input);
    expect(result.relationships[0]).toEqual({
      id: 'rel_0',
      from: 'User',
      to: 'Login',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: 'very important',
    });
  });

  it('should parse multiple edge labels', () => {
    const input = `usecase
actor Developer
actor Tester
Developer --primary--> "Code Review"
Tester --secondary--> "Bug Testing"`;

    const result = parse(input);
    expect(result.relationships).toHaveLength(2);
    expect(result.relationships[0]).toEqual({
      id: 'rel_0',
      from: 'Developer',
      to: 'Code Review',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: 'primary',
    });
    expect(result.relationships[1]).toEqual({
      id: 'rel_1',
      from: 'Tester',
      to: 'Bug Testing',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: 'secondary',
    });
  });

  it('should parse edge labels with different arrow types', () => {
    const input = `usecase
actor User
actor Admin
User --important--> Login
Admin <--critical-- Manage
User --optional-- Dashboard`;

    const result = parse(input);
    expect(result.relationships).toHaveLength(3);
    expect(result.relationships[0].label).toBe('important');
    expect(result.relationships[1].label).toBe('critical');
    expect(result.relationships[2].label).toBe('optional');
  });

  it('should maintain backward compatibility with unlabeled arrows', () => {
    const input = `usecase
actor User
User --> Login
User --important--> Manage`;

    const result = parse(input);
    expect(result.relationships).toHaveLength(2);
    expect(result.relationships[0]).toEqual({
      id: 'rel_0',
      from: 'User',
      to: 'Login',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
    });
    expect(result.relationships[1]).toEqual({
      id: 'rel_1',
      from: 'User',
      to: 'Manage',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: 'important',
    });
  });

  it('should work with node ID syntax and edge labels', () => {
    const input = `usecase
actor Developer
Developer --critical--> a(Code Review)
Developer --optional--> b(Documentation)`;

    const result = parse(input);
    expect(result.relationships).toHaveLength(2);
    expect(result.relationships[0]).toEqual({
      id: 'rel_0',
      from: 'Developer',
      to: 'Code Review',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: 'critical',
    });
    expect(result.relationships[1]).toEqual({
      id: 'rel_1',
      from: 'Developer',
      to: 'Documentation',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: 'optional',
    });
    expect(result.useCases[0].nodeId).toBe('a');
    expect(result.useCases[1].nodeId).toBe('b');
  });

  it('should work with inline actor declarations and edge labels', () => {
    const input = `usecase
actor Developer --important--> a(coding)
actor Tester --critical--> b(testing)`;

    const result = parse(input);
    expect(result.actors).toHaveLength(2);
    expect(result.relationships).toHaveLength(2);
    expect(result.relationships[0]).toEqual({
      id: 'rel_0',
      from: 'Developer',
      to: 'coding',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: 'important',
    });
    expect(result.relationships[1]).toEqual({
      id: 'rel_1',
      from: 'Tester',
      to: 'testing',
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: 'critical',
    });
  });
});

describe('Error Handling', () => {
  describe('Syntax Error Handling', () => {
    it('should throw UsecaseParseError for invalid syntax', () => {
      const invalidSyntax = `usecase
        invalid syntax here
        actor User
      `;

      expect(() => parseUsecaseWithAntlr(invalidSyntax)).toThrow(UsecaseParseError);
      expect(() => parseUsecaseWithAntlr(invalidSyntax)).toThrow(/Syntax error in usecase diagram/);
    });

    it('should throw UsecaseParseError for incomplete relationships', () => {
      const incompleteSyntax = `usecase
        actor User
        User -->
      `;

      expect(() => parseUsecaseWithAntlr(incompleteSyntax)).toThrow(UsecaseParseError);
      expect(() => parseUsecaseWithAntlr(incompleteSyntax)).toThrow(/mismatched input/);
    });

    it('should throw UsecaseParseError for malformed actor declarations', () => {
      const malformedSyntax = `usecase
        actor
        actor User
      `;

      expect(() => parseUsecaseWithAntlr(malformedSyntax)).toThrow(UsecaseParseError);
      expect(() => parseUsecaseWithAntlr(malformedSyntax)).toThrow(/no viable alternative/);
    });

    it('should throw UsecaseParseError for invalid arrow syntax', () => {
      const invalidArrowSyntax = `usecase
        actor User
        User -invalid-> Login
      `;

      expect(() => parseUsecaseWithAntlr(invalidArrowSyntax)).toThrow(UsecaseParseError);
      expect(() => parseUsecaseWithAntlr(invalidArrowSyntax)).toThrow(/token recognition error/);
    });

    it('should throw UsecaseParseError for empty input', () => {
      const emptyInput = '';

      expect(() => parseUsecaseWithAntlr(emptyInput)).toThrow(UsecaseParseError);
      expect(() => parseUsecaseWithAntlr(emptyInput)).toThrow(/missing 'usecase'/);
    });

    it('should throw UsecaseParseError for only whitespace input', () => {
      const whitespaceInput = '   \n  \t  \n  ';

      expect(() => parseUsecaseWithAntlr(whitespaceInput)).toThrow(UsecaseParseError);
      expect(() => parseUsecaseWithAntlr(whitespaceInput)).toThrow(/missing 'usecase'/);
    });

    it('should throw UsecaseParseError for missing usecase keyword', () => {
      const missingKeyword = `
        actor User
        User --> Login
      `;

      expect(() => parseUsecaseWithAntlr(missingKeyword)).toThrow(UsecaseParseError);
      expect(() => parseUsecaseWithAntlr(missingKeyword)).toThrow(/missing 'usecase'/);
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle duplicate actor IDs by keeping both', () => {
      const duplicateActors = `usecase
        actor User
        actor User
        User --> Login
      `;

      const result = parseUsecaseWithAntlr(duplicateActors);
      expect(result).toBeDefined();
      expect(result.actors).toHaveLength(2);
      expect(result.actors[0].id).toBe('User');
      expect(result.actors[1].id).toBe('User');
    });

    it('should handle self-referencing relationships', () => {
      const selfReference = `usecase
        actor User
        User --> User
      `;

      const result = parseUsecaseWithAntlr(selfReference);
      expect(result).toBeDefined();
      expect(result.actors).toHaveLength(1);
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].from).toBe('User');
      expect(result.relationships[0].to).toBe('User');
    });

    it('should handle very long entity names', () => {
      const longName = 'A'.repeat(1000);
      const longNameSyntax = `usecase
        actor "${longName}"
        "${longName}" --> Login
      `;

      const result = parseUsecaseWithAntlr(longNameSyntax);
      expect(result).toBeDefined();
      expect(result.actors).toHaveLength(1);
      expect(result.actors[0].id).toBe(longName);
    });

    it('should handle special characters in names', () => {
      const specialCharsSyntax = `usecase
        actor "User@Domain.com"
        "User@Domain.com" --> "Login/Logout"
      `;

      const result = parseUsecaseWithAntlr(specialCharsSyntax);
      expect(result).toBeDefined();
      expect(result.actors).toHaveLength(1);
      expect(result.actors[0].id).toBe('User@Domain.com');
      expect(result.useCases).toHaveLength(1);
      expect(result.useCases[0].id).toBe('Login/Logout');
    });
  });

  describe('Edge Cases', () => {
    it('should throw UsecaseParseError for mixed valid and invalid syntax', () => {
      const mixedSyntax = `usecase
        actor User
        invalid line here
        User --> Login
        another invalid line
        actor Admin
      `;

      expect(() => parseUsecaseWithAntlr(mixedSyntax)).toThrow(UsecaseParseError);
      expect(() => parseUsecaseWithAntlr(mixedSyntax)).toThrow(/no viable alternative/);
    });

    it('should handle Unicode characters', () => {
      const unicodeSyntax = `usecase
        actor "用户"
        "用户" --> "登录"
      `;

      const result = parseUsecaseWithAntlr(unicodeSyntax);
      expect(result).toBeDefined();
      expect(result.actors).toHaveLength(1);
      expect(result.actors[0].id).toBe('用户');
      expect(result.useCases).toHaveLength(1);
      expect(result.useCases[0].id).toBe('登录');
    });

    it('should handle very large diagrams', () => {
      let largeDiagram = 'usecase\n';
      for (let i = 0; i < 100; i++) {
        largeDiagram += `  actor User${i}\n`;
        largeDiagram += `  User${i} --> UseCase${i}\n`;
      }

      const result = parseUsecaseWithAntlr(largeDiagram);
      expect(result).toBeDefined();
      expect(result.actors).toHaveLength(100);
      expect(result.useCases).toHaveLength(100);
      expect(result.relationships).toHaveLength(100);
    });
  });
});
