import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('Usecase diagram', () => {
  it('should render a simple usecase diagram with actors and use cases', () => {
    imgSnapshotTest(
      `
      usecase
        actor User
        actor Admin
        User --> Login
        Admin --> "Manage Users"
        User --> "View Profile"
      `
    );
  });

  it('should render usecase diagram with quoted actor names', () => {
    imgSnapshotTest(
      `usecase
        actor "Customer Service"
        actor "System Administrator"
        "Customer Service" --> "Handle Tickets"
        "System Administrator" --> "Manage System"
      `
    );
  });

  it('should render usecase diagram with different arrow types', () => {
    imgSnapshotTest(
      `usecase
        actor User
        actor Admin
        User --> Login
        Admin <-- Logout
        User -- "View Data"
      `
    );
  });

  it('should render usecase diagram with edge labels', () => {
    imgSnapshotTest(
      `usecase
        actor Developer
        actor Manager
        Developer --important--> "Write Code"
        Manager --review--> "Code Review"
        Developer --urgent--> Manager
      `
    );
  });

  it('should render usecase diagram with node ID syntax', () => {
    imgSnapshotTest(
      `usecase
        actor User
        User --> a(Login)
        User --> b("View Profile")
        User --> c("Update Settings")
      `
    );
  });

  it('should render usecase diagram with comma-separated actors', () => {
    imgSnapshotTest(
      `usecase
        actor "Customer Service", "Technical Support", "Sales Team"
        actor SystemAdmin
        "Customer Service" --> "Handle Tickets"
        "Technical Support" --> "Resolve Issues"
        "Sales Team" --> "Process Orders"
        SystemAdmin --> "Manage System"
      `
    );
  });

  it('should render usecase diagram with actor metadata', () => {
    imgSnapshotTest(
      `usecase
        actor User@{ "type" : "primary", "icon" : "user" }
        actor Admin@{ "type" : "secondary", "icon" : "admin" }
        actor System@{ "type" : "hollow", "icon" : "system" }
        User --> Login
        Admin --> "Manage Users"
        System --> "Process Data"
      `
    );
  });

  it('should render usecase diagram with system boundaries (rect type)', () => {
    imgSnapshotTest(
      `usecase
        actor Admin, User
        systemBoundary "Authentication"
          Login
          Logout
          "Reset Password"
        end
        "Authentication"@{ type: rect }
        Admin --> Login
        User --> Login
        User --> "Reset Password"
      `
    );
  });

  it('should render usecase diagram with system boundaries (package type)', () => {
    imgSnapshotTest(
      `usecase
        actor Admin, User
        systemBoundary "Authentication"
          Login
          Logout
          "Reset Password"
        end
        "Authentication"@{ type: package }
        Admin --> Login
        User --> Login
        User --> "Reset Password"
      `
    );
  });

  it('should render complex usecase diagram with all features', () => {
    imgSnapshotTest(
      `usecase
        actor "Customer Service"@{ "type" : "primary", "icon" : "user" }
        actor "System Admin"@{ "type" : "secondary", "icon" : "admin" }
        actor "Database"@{ "type" : "hollow", "icon" : "database" }

        systemBoundary "Customer Support System"
          "Handle Tickets"
          "View Customer Info"
        end
        "Customer Support System"@{ type: package }

        systemBoundary "Administration"
          "User Management"
          "System Config"
        end

        "Customer Service" --priority--> "Handle Tickets"
        "Customer Service" --> "View Customer Info"
        "System Admin" --manage--> "User Management"
        "System Admin" --> "System Config"
        "Database" <-- "Handle Tickets"
        "Database" <-- "View Customer Info"
        "Database" <-- "User Management"
      `
    );
  });

  it('should render usecase diagram with actor-to-actor relationships', () => {
    imgSnapshotTest(
      `usecase
        actor Manager
        actor Developer
        actor Tester
        
        Manager --supervises--> Developer
        Manager --coordinates--> Tester
        Developer --collaborates--> Tester
        
        Developer --> "Write Code"
        Tester --> "Test Code"
        Manager --> "Review Progress"
      `
    );
  });

  it('should render usecase diagram with mixed relationship types', () => {
    imgSnapshotTest(
      `usecase
        actor User
        actor Admin
        
        User --> "Basic Login"
        Admin --> "Advanced Login"
        User --includes--> "View Profile"
        Admin --extends--> "Manage Profiles"
        
        "Basic Login" <-- "Advanced Login"
      `
    );
  });

  it('should render usecase diagram with long labels and text wrapping', () => {
    imgSnapshotTest(
      `usecase
        actor "Customer Service Representative"
        actor "System Administrator with Extended Privileges"
        
        "Customer Service Representative" --Process--> "Handle Complex Customer Support Tickets"
        "System Administrator with Extended Privileges" --> "Manage System Configuration and User Permissions"
      `
    );
  });

  it('should render usecase diagram with special characters in names', () => {
    imgSnapshotTest(
      `usecase
        actor "User@Company.com"
        actor "Admin (Level-1)"        
        "User@Company.com" --> a("Login & Authenticate")
        "Admin (Level-1)" --> b("Manage Users & Permissions")
      `
    );
  });

  it('should render usecase diagram when useMaxWidth is true (default)', () => {
    renderGraph(
      `usecase
        actor User
        actor Admin
        User --> Login
        Admin --> "Manage System"
        User --> "View Profile"
      `,
      { usecase: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
    });
  });

  it('should render usecase diagram when useMaxWidth is false', () => {
    renderGraph(
      `usecase
        actor User
        actor Admin
        User --> Login
        Admin --> "Manage System"
      `,
      { usecase: { useMaxWidth: false } }
    );
    cy.get('svg').should((svg) => {
      const width = parseFloat(svg.attr('width'));
      expect(width).to.be.greaterThan(200);
      expect(svg).to.not.have.attr('style');
    });
  });

  it('should render empty usecase diagram', () => {
    imgSnapshotTest(`usecase`);
  });

  it('should render usecase diagram with only actors', () => {
    imgSnapshotTest(
      `usecase
        actor User
        actor Admin
        actor Guest
      `
    );
  });

  it('should render usecase diagram with implicit use case creation', () => {
    imgSnapshotTest(
      `usecase
        actor User
        User --> Login
        User --> Register
        User --> "Forgot Password"
      `
    );
  });

  it('should render usecase diagram with nested system boundaries', () => {
    imgSnapshotTest(
      `usecase
        actor User
        actor Admin

        systemBoundary "Main System"
          Login
          Logout
          "Create User"
          "Delete User"
        end

        User --> Login
        User --> Logout
        Admin --> "Create User"
        Admin --> "Delete User"
      `
    );
  });

  it('should render usecase diagram with multiple edge labels on same relationship', () => {
    imgSnapshotTest(
      `usecase
        actor Developer
        actor Manager

        Developer --"code review"--> Manager
        Developer --"status update"--> Manager
        Manager --"feedback"--> Developer
        Manager --"approval"--> Developer
      `
    );
  });

  it('should render usecase diagram with various actor icon types', () => {
    imgSnapshotTest(
      `usecase
        actor User@{ "icon": "user" }
        actor Admin@{ "icon": "admin" }
        actor Database@{ "icon": "database" }
        actor API@{ "icon": "api" }
        actor Mobile@{ "icon": "mobile" }
        actor Web@{ "icon": "web" }

        User --> "Access System"
        Admin --> "Manage System"
        Database --> "Store Data"
        API --> "Provide Services"
        Mobile --> "Mobile Access"
        Web --> "Web Access"
      `
    );
  });

  it('should render usecase diagram with mixed arrow directions and labels', () => {
    imgSnapshotTest(
      `usecase
        actor User
        actor System
        actor Admin

        User --request--> System
        System --response--> User
        System <--monitor-- Admin
        Admin --configure--> System
        User -- "direct access" -- Admin
      `
    );
  });

  it('should render usecase diagram with boundary-less use cases', () => {
    imgSnapshotTest(
      `usecase
        actor User
        actor Admin

        systemBoundary "Secure Area"
          "Admin Panel"
          "User Management"
        end

        User --> "Public Login"
        User --> "Guest Access"
        Admin --> "Public Login"
        Admin --> "Admin Panel"
        Admin --> "User Management"
      `
    );
  });

  it('should render usecase diagram with complex metadata combinations', () => {
    imgSnapshotTest(
      `usecase
        actor "Primary User"@{ "type": "primary", "icon": "user", "fillColor": "lightblue" }
        actor "Secondary User"@{ "type": "secondary", "icon": "client", "strokeColor": "red" }
        actor "System Service"@{ "type": "hollow", "icon": "service", "strokeWidth": "3" }

        "Primary User" --"high priority"--> a("Critical Process")
        "Secondary User" --"low priority"--> b("Background Task")
        "System Service" --"automated"--> c("System Maintenance")
      `
    );
  });

  it('should render usecase diagram with Unicode characters', () => {
    imgSnapshotTest(
      `usecase
        actor "用户"@{ "icon": "user" }
        actor "管理员"@{ "icon": "admin" }

        "用户" --"登录"--> "系统访问"
        "管理员" --"管理"--> "用户管理"
        "用户" --> "数据查看"
      `
    );
  });

  it('should render large usecase diagram with many elements', () => {
    imgSnapshotTest(
      `usecase
        actor User1, User2, User3, User4
        actor Admin1, Admin2
        actor System1@{ "icon": "system" }
        actor System2@{ "icon": "database" }

        systemBoundary "Module A"
          "Feature A1"
          "Feature A2"
          "Admin A1"
        end
        "Module A"@{ type: package }

        systemBoundary "Module B"
          "Feature B1"
          "Feature B2"
          "Admin B1"
        end

        User1 --> "Feature A1"
        User2 --> "Feature A2"
        Admin1 --> "Admin A1"
        User3 --> "Feature B1"
        User4 --> "Feature B2"
        Admin2 --> "Admin B1"

        System1 <-- "Feature A1"
        System1 <-- "Feature B1"
        System2 <-- "Admin A1"
        System2 <-- "Admin B1"

        User1 --"collaborates"--> User2
        Admin1 --"supervises"--> Admin2
      `
    );
  });
});
