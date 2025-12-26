import { imgSnapshotTest } from '../../helpers/util.ts';

describe('Treemap Diagram', () => {
  it('1: should render a basic treemap', () => {
    imgSnapshotTest(
      `treemap-beta
"Category A"
    "Item A1": 10
    "Item A2": 20
"Category B"
    "Item B1": 15
    "Item B2": 25
      `,
      {}
    );
  });

  it('2: should render a hierarchical treemap', () => {
    imgSnapshotTest(
      `treemap-beta
"Products"
    "Electronics"
        "Phones": 50
        "Computers": 30
        "Accessories": 20
    "Clothing"
        "Men's"
            "Shirts": 10
            "Pants": 15
        "Women's"
            "Dresses": 20
            "Skirts": 10
      `,
      {}
    );
  });

  it('3: should render a treemap with styling using classDef', () => {
    imgSnapshotTest(
      `treemap-beta
"Section 1"
    "Leaf 1.1": 12
    "Section 1.2":::class1
      "Leaf 1.2.1": 12
"Section 2"
    "Leaf 2.1": 20:::class1
    "Leaf 2.2": 25
    "Leaf 2.3": 12

classDef class1 fill:red,color:blue,stroke:#FFD600;
      `,
      {}
    );
  });

  it('4: should handle long text that wraps', () => {
    imgSnapshotTest(
      `treemap-beta
"Main Category"
    "This is a very long item name that should wrap to the next line when rendered in the treemap diagram": 50
    "Short item": 20
      `,
      {}
    );
  });

  it('5: should render with a forest theme', () => {
    imgSnapshotTest(
      `---
config:
  theme: forest
---
treemap-beta
"Category A"
    "Item A1": 10
    "Item A2": 20
"Category B"
    "Item B1": 15
    "Item B2": 25
      `,
      {}
    );
  });

  it('6: should handle multiple levels of nesting', () => {
    imgSnapshotTest(
      `treemap-beta
"Level 1"
    "Level 2A"
        "Level 3A": 10
        "Level 3B": 15
    "Level 2B"
        "Level 3C": 20
        "Level 3D"
            "Level 4A": 5
            "Level 4B": 5
      `,
      {}
    );
  });

  it('7: should handle classDef with multiple styles', () => {
    imgSnapshotTest(
      `treemap-beta
"Main"
    "A": 20
    "B":::important
        "B1": 10
        "B2": 15
    "C": 5:::secondary

classDef important fill:#f96,stroke:#333,stroke-width:2px;
classDef secondary fill:#6cf,stroke:#333,stroke-dasharray:5 5;
      `,
      {}
    );
  });

  it('8: should handle dollar value formatting with thousands separator', () => {
    imgSnapshotTest(
      `---
config:
  treemap:
    valueFormat: "$0,0"
---
treemap
"Budget"
    "Operations"
        "Salaries": 700000
        "Equipment": 200000
        "Supplies": 100000
    "Marketing"
        "Advertising": 400000
        "Events": 100000
      `,
      {}
    );
  });

  it('8a: should handle percentage formatting', () => {
    imgSnapshotTest(
      `---
config:
  treemap:
    valueFormat: ".1%"
---
treemap-beta
"Market Share"
    "Company A": 0.35
    "Company B": 0.25
    "Company C": 0.15
    "Others": 0.25
      `,
      {}
    );
  });

  it('8b: should handle decimal formatting', () => {
    imgSnapshotTest(
      `---
config:
  treemap:
    valueFormat: ".2f"
---
treemap-beta
"Metrics"
    "Conversion Rate": 0.0567
    "Bounce Rate": 0.6723
    "Click-through Rate": 0.1289
    "Engagement": 0.4521
      `,
      {}
    );
  });

  it('8c: should handle dollar sign with decimal places', () => {
    imgSnapshotTest(
      `---
config:
  treemap:
    valueFormat: "$.2f"
---
treemap-beta
"Product Prices"
    "Basic": 19.99
    "Standard": 49.99
    "Premium": 99.99
    "Enterprise": 199.99
      `,
      {}
    );
  });

  it('8d: should handle dollar sign with thousands separator and decimal places', () => {
    imgSnapshotTest(
      `---
config:
  treemap:
    valueFormat: "$,.2f"
---
treemap-beta
"Revenue"
    "Q1": 1250345.75
    "Q2": 1645789.25
    "Q3": 1845123.50
    "Q4": 2145678.75
      `,
      {}
    );
  });

  it('8e: should handle simple thousands separator', () => {
    imgSnapshotTest(
      `---
config:
  treemap:
    valueFormat: ","
---
treemap-beta
"User Counts"
    "Active Users": 1250345
    "New Signups": 45789
    "Churned": 12350
    "Converted": 78975
      `,
      {}
    );
  });

  it('8f: should handle valueFormat set via directive with dollar and thousands separator', () => {
    imgSnapshotTest(
      `---
config:
  treemap:
    valueFormat: "$,.0f"
---
treemap-beta
"Sales by Region"
    "North": 1234567
    "South": 7654321
    "East": 4567890
    "West": 9876543
      `,
      {}
    );
  });

  it('8g: should handle scientific notation format', () => {
    imgSnapshotTest(
      `---
config:
  treemap:
    valueFormat: ".2e"
---
treemap-beta
"Scientific Values"
    "Value 1": 1234567
    "Value 2": 0.0000123
    "Value 3": 1000000000
      `,
      {}
    );
  });

  it('9: should handle a complex example with multiple features', () => {
    imgSnapshotTest(
      `---
config:
  theme: dark
  treemap:
    valueFormat: "$0,0"
---
treemap-beta
"Company Budget"
    "Engineering":::engineering
        "Frontend": 300000
        "Backend": 400000
        "DevOps": 200000
    "Marketing":::marketing
        "Digital": 250000
        "Print": 100000
        "Events": 150000
    "Sales":::sales
        "Direct": 500000
        "Channel": 300000

classDef engineering fill:#6b9bc3,stroke:#333;
classDef marketing fill:#c36b9b,stroke:#333;
classDef sales fill:#c3a66b,stroke:#333;
      `,
      {}
    );
  });

  it('10: should render the example from documentation', () => {
    imgSnapshotTest(
      `
    treemap-beta
      "Section 1"
          "Leaf 1.1": 12
          "Section 1.2":::class1
            "Leaf 1.2.1": 12
      "Section 2"
          "Leaf 2.1": 20:::class1
          "Leaf 2.2": 25
          "Leaf 2.3": 12

      classDef class1 fill:red,color:blue,stroke:#FFD600;
      `,
      {}
    );
  });

  it('11: should handle comments', () => {
    imgSnapshotTest(
      `
    treemap-beta
      %% This is a comment
      "Category A"
          "Item A1": 10
          "Item A2": 20
      %% Another comment
      "Category B"
          "Item B1": 15
          "Item B2": 25
      `,
      {}
    );
  });

  it('12: should apply classDef fill color to leaf nodes', () => {
    imgSnapshotTest(
      `treemap-beta
"Root"
    "Item A": 30:::redClass
    "Item B": 20
    "Item C": 25:::blueClass

classDef redClass fill:#ff0000;
classDef blueClass fill:#0000ff;
      `,
      {}
    );
  });

  it('13: should apply classDef stroke styles to sections', () => {
    imgSnapshotTest(
      `treemap-beta
      %% This is a comment
      "Category A":::thickBorder
          "Item A1": 10
          "Item A2": 20
      %% Another comment
      "Category B":::dashedBorder
          "Item B1": 15
          "Item B2": 25

classDef thickBorder stroke:red,stroke-width:8px;
classDef dashedBorder stroke:black,stroke-dasharray:5,stroke-width:8px;
      `,
      {}
    );
  });

  it('14: should apply classDef color to text labels', () => {
    imgSnapshotTest(
      `treemap-beta
"Products"
    "Electronics":::whiteText
        "Phones": 40
        "Laptops": 30
    "Furniture":::darkText
        "Chairs": 25
        "Tables": 20

classDef whiteText fill:#2c3e50,color:#ffffff;
classDef darkText fill:#ecf0f1,color:#000000;
      `,
      {}
    );
  });

  it('15: should apply multiple classDef properties simultaneously', () => {
    imgSnapshotTest(
      `treemap-beta
"Budget"
    "Critical":::critical
        "Server Costs": 50000
        "Salaries": 80000
    "Normal":::normal
        "Office Supplies": 5000
        "Marketing": 15000
classDef critical fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:3px;
classDef normal fill:#3498db,color:#fff,stroke:#2980b9,stroke-width:1px;
      `,
      {}
    );
  });

  it('16: should handle classDef on nested sections and leaves', () => {
    imgSnapshotTest(
      `treemap-beta
"Company"
    "Engineering":::engSection
        "Frontend": 30:::highlight
        "Backend": 40
        "DevOps": 20:::highlight
    "Sales"
        "Direct": 35
        "Channel": 25:::highlight

classDef engSection fill:#9b59b6,stroke:#8e44ad,stroke-width:2px;
classDef highlight fill:#f39c12,color:#000,stroke:#e67e22,stroke-width:2px;
      `,
      {}
    );
  });

  /*
  it.skip('17: should render a treemap with title', () => {
    imgSnapshotTest(
      `
    treemap-beta
      title Treemap with Title
      "Category A"
          "Item A1": 10
          "Item A2": 20
      "Category B"
          "Item B1": 15
          "Item B2": 25
      `,
      {}
    );
  });

  it.skip('13: should render a treemap with accessibility attributes', () => {
    imgSnapshotTest(
      `
    treemap-beta
      accTitle: Accessible Treemap Title
      accDescr: This is a description of the treemap for accessibility purposes
      "Category A"
          "Item A1": 10
          "Item A2": 20
      "Category B"
          "Item B1": 15
          "Item B2": 25
      `,
      {}
    );
  });

  it.skip('14: should render a treemap with title and accessibility attributes', () => {
    imgSnapshotTest(
      `
    treemap
      title Treemap with Title and Accessibility
      accTitle: Accessible Treemap Title
      accDescr: This is a description of the treemap for accessibility purposes
      "Category A"
          "Item A1": 10
          "Item A2": 20
      "Category B"
          "Item B1": 15
          "Item B2": 25
      `,
      {}
    );
  });
  */
});
