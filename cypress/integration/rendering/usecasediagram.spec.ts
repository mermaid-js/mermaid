// cspell:ignore usecase usecases
import { imgSnapshotTest } from '../../helpers/util';

describe('UseCase Diagram', () => {
  it('renders a minimal diagram', () => {
    imgSnapshotTest(
      `useCase
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
      `useCase
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
      `useCase
      actor "Customer" as C
      external "Barcode Reader" as BRS
      system "Warehouse" {
        usecase "Scan Items" as SI;
        "Move Items" as MI;
      }
      C --> SI; MI;
      BRS --> SI;`,
      {},
    );
  });

  it('renders generalization', () => {
    imgSnapshotTest(
      `useCase
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

  it('renders all relationship types', () => {
    imgSnapshotTest(
      `useCase
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
      }
      U --> LG; PO;
      ADM --> AL; RF; SA;
      PAY --> PY;
      include: PO-->LG; PO-->PY;
      extend: RF-->PO;
      generalization: SA-->ADM;
      dependency: PY-->VID;
      realization: AL-->LG;`,
      {},
    );
  });

  it('renders a large ACME diagram', () => {
    imgSnapshotTest(
      `useCase
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
      BRS --> UC9;
      RCS --> UC11;
      include: UC4-->UC6; UC6-->UC10; UC8-->UC9; UC9-->UC10; UC11-->UC12;
      extend: UC5-->UC; UC2-->UC3;`,
      {},
    );
  });
});