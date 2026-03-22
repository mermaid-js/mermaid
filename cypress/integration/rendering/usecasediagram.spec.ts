// cspell:ignore usecase usecases
import { imgSnapshotTest } from '../../helpers/util.ts';

describe('UseCase Diagram', () => {
  it('renders a minimal diagram', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "User" as U
      system "App" {
        usecase "Login" as L;
        "Dashboard" as D;
      }
      U --> L; D;`,
      {},
    );
  });

  it('renders include and extend relationships', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "Customer" as C
      actor "Admin" as A
      system "Shop" {
        usecase "Browse Products" as BP;
        "Add to Cart" as AC;
        "Checkout" as CO;
        "Login" as LG;
        "Manage Products" as MP;
      }
      C --> BP; AC; CO;
      A --> MP;
      include: CO-->LG; AC-->LG;
      extend: BP-->AC;`,
      {},
    );
  });

  it('renders external systems', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "Customer" as C
      external "Barcode Reader" as BRS
      system "Warehouse" {
        usecase "Scan Items" as SI;
        "Move Items" as MI;
      }
      C --> SI; MI;
      dependency: BRS --> SI;`,
      {},
    );
  });

  it('renders generalization', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "Admin" as A
      actor "Super Admin" as SA
      system "System" {
        usecase "Manage Users" as MU;
        "Delete Users" as DU;
      }
      A --> MU;
      SA --> DU;
      generalization: SA-->A;`,
      {},
    );
  });

  it('renders dependency and realization', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "User" as U
      external "Payment API" as PAY
      system "Payments" {
        usecase "Process Payment" as PP;
        "Verify Identity" as VI;
      }
      U --> PP;
      dependency: PP-->PAY;
      realization: PP-->VI;`,
      {},
    );
  });

  it('renders anchor (note linked to usecase)', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "User" as U
      system "App" {
        usecase "Login" as L;
        "Biometric Login" as BL;
      }
      note "Requires 2FA" as N1
      U --> L;
      include: BL-->L;
      anchor: N1-->L;`,
      {},
    );
  });

  it('renders constraint between usecases', () => {
    imgSnapshotTest(
      `usecaseDiagram
      system "System" {
        usecase "Place Order" as PO;
        "Checkout" as CO;
        "Verify Stock" as VS;
      }
      constraint: CO-->PO;
      constraint: PO-->VS;`,
      {},
    );
  });

  it('renders containment (usecase inside usecase)', () => {
    imgSnapshotTest(
      `usecaseDiagram
      system "System" {
        usecase "Checkout" as CO;
        "Internal Log" as IL;
      }
      containment: CO-->IL;`,
      {},
    );
  });

  it('renders collaboration (dashed oval)', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "User" as U
      collaboration "Auth Flow" as AF
      system "App" {
        usecase "Login" as L;
      }
      U --> L;
      association: AF-->L;
      dependency: AF-->L;`,
      {},
    );
  });

  it('renders all relationship types', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "User" as U
      actor "Admin" as ADM
      external "Payment API" as PAY
      system "All Line Types" {
        usecase "Login" as LG;
        "Pay" as PY;
        "Verify ID" as VID;
        "Place Order" as PO;
        "Refund" as RF;
        "Audit Log" as AL;
        "Super Admin" as SA;
        "Internal Log" as IL;
      }
      note "Requires Auth" as N1
      U --> LG; PO;
      ADM --> AL; RF; SA;
      include: PO-->LG; PO-->PY;
      extend: RF-->PO;
      generalization: SA-->ADM;
      dependency: PY-->PAY;
      realization: AL-->LG;
      anchor: N1-->LG;
      constraint: IL-->PY;
      containment: PO-->IL;`,
      {},
    );
  });

  it('renders the comprehensive test diagram', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "Customer" as C
      actor "Premium User" as PU
      external "Bank API" as B
      system "Comprehensive Test" {
        usecase "Login" as L;
        usecase "Biometric Login" as BL;
        usecase "Checkout" as CO;
        usecase "Apply Discount" as AD;
        usecase "Process Payment" as PP;
        usecase "Internal Log" as IL;
      }
      note "Requires 2FA" as N1
      C --> L;
      generalization: PU-->C;
      generalization: BL-->L;
      include: CO-->L;
      extend: L-->AD;
      dependency: PP-->B;
      realization: BL-->L;
      anchor: N1-->L;
      constraint: IL-->PP;
      containment: CO-->IL;`,
      {},
    );
  });

  it('renders a large ACME diagram', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "Customer" as C; "Office personnel" as OP; "Foreman" as F; "Warehouse Worker" as WW; "ForkLift Operator" as FO; "Truck Driver" as TD;
      external "Barcode Reader System" as BRS; "Radio Communication System" as RCS;
      system "ACME System" {
        usecase "Submit Storage Request" as UC;
        "Request distribution" as UC2;
        "Track Item Status" as UC3;
        "Create Redistribution order" as UC4;
        "Register Customer" as UC5;
        "Assign Task" as UC6;
        "Monitor Operations" as UC7;
        "Register Incoming Items" as UC8;
        "Scan Items" as UC9;
        "Move Items" as UC10;
        "Transport Items" as UC11;
        "Confirm Delivery" as UC12;
      }
      C --> UC; UC2; UC3;
      OP --> UC4; UC5;
      F --> UC6; UC7;
      WW --> UC8; UC9;
      FO --> UC10;
      TD --> UC11; UC12;
      dependency: BRS-->UC9;
      dependency: RCS-->UC11;
      include: UC4-->UC6; UC6-->UC10; UC8-->UC9; UC9-->UC10; UC11-->UC12;
      extend: UC5-->UC; UC2-->UC3;`,
      {},
    );
  });

  it('renders invalid connections silently without crashing', () => {
    imgSnapshotTest(
      `usecaseDiagram
      actor "User" as U
      external "API" as E
      system "App" {
        usecase "Login" as L;
      }
      U --> L;
      association: E-->L;`,
      {},
    );
  });

  describe('theming', () => {
    it('renders with default theme', () => {
      imgSnapshotTest(
        `usecaseDiagram
        actor "User" as U
        system "App" {
          usecase "Login" as L;
        }
        U --> L;`,
        {},
      );
    });

    it('renders with custom themeVariables', () => {
      imgSnapshotTest(
        `%%{init: {'theme':'base','themeVariables':{'primaryColor':'#ffffce','secondaryColor':'#ffffff','primaryBorderColor':'#000000','lineColor':'#000000'}}}%%
        usecaseDiagram
        actor "User" as U
        system "App" {
          usecase "Login" as L;
          "Dashboard" as D;
        }
        U --> L; D;`,
        {},
      );
    });

    it('renders with dark theme', () => {
      imgSnapshotTest(
        `%%{init: {'theme':'dark'}}%%
        usecaseDiagram
        actor "User" as U
        system "App" {
          usecase "Login" as L;
        }
        U --> L;`,
        {},
      );
    });
  });
});