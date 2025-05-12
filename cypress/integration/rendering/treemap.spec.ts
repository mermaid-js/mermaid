import { imgSnapshotTest } from '../../helpers/util.ts';

describe('Treemap Diagram', () => {
  it('1: should render a basic treemap', () => {
    imgSnapshotTest(
      `treemap
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
      `treemap
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
      `treemap
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
      `treemap
"Main Category"
    "This is a very long item name that should wrap to the next line when rendered in the treemap diagram": 50
    "Short item": 20
      `,
      {}
    );
  });

  it('5: should render with a forest theme', () => {
    imgSnapshotTest(
      `%%{init: {'theme': 'forest'}}%%
treemap
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
      `treemap
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
      `treemap
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

  it('8: should handle value formatting', () => {
    imgSnapshotTest(
      `%%{init: {'treemap': {'valueFormat': '$0,0'}}}%%
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

  it('9: should handle a complex example with multiple features', () => {
    imgSnapshotTest(
      `%%{init: {'theme': 'dark', 'treemap': {'valueFormat': '$0,0'}}}%%
treemap
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
    treemap
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
    treemap
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
});
