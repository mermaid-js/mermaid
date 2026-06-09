import { setConfig } from '../../../config.js';
import { RequirementDB } from '../requirementDb.js';
// @ts-ignore: JISON doesn't support types
import reqDiagram from './requirementDiagram.jison';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing requirement diagram it...', function () {
  const requirementDb = new RequirementDB();
  beforeEach(function () {
    reqDiagram.parser.yy = requirementDb;
    reqDiagram.parser.yy.clear();
  });

  it('will accept full requirement definition', function () {
    const expectedName = 'test_req';
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `requirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    expect(requirementDb.getRequirements().size).toBe(1);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.requirementId).toBe(expectedId);
    expect(foundReq.text).toBe(expectedText);

    expect(requirementDb.getElements().size).toBe(0);
    expect(Object.keys(requirementDb.getRelationships()).length).toBe(0);
  });

  it('will accept full element definition', function () {
    const expectedName = 'test_el';
    const expectedType = 'test_type';
    const expectedDocRef = 'test_ref';

    const lines = [
      `requirementDiagram`,
      ``,
      `element ${expectedName} {`,
      `type: ${expectedType}`,
      `docref: ${expectedDocRef}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    expect(requirementDb.getRequirements().size).toBe(0);
    expect(requirementDb.getElements().size).toBe(1);

    const foundElement = requirementDb.getElements().get(expectedName)!;
    expect(foundElement).toBeDefined();
    expect(foundElement.type).toBe(expectedType);
    expect(foundElement.docRef).toBe(expectedDocRef);

    expect(Object.keys(requirementDb.getRelationships()).length).toBe(0);
  });

  it('will use a accessibility title and description (accDescr)', function () {
    const expectedTitle = 'test title';
    const expectedAccDescription = 'my chart description';

    const doc = `requirementDiagram
      accTitle: ${expectedTitle}
      accDescr: ${expectedAccDescription}
      element test_name {
      type: test_type
      docref: test_ref
      }`;

    reqDiagram.parser.parse(doc);

    expect(requirementDb.getAccTitle()).toBe(expectedTitle);
    expect(requirementDb.getAccDescription()).toBe(expectedAccDescription);
  });

  it('will use a accessibility title and multiline description (accDescr)', function () {
    const expectedTitle = 'test title';
    const expectedAccDescription = `my chart description
line 2`;

    const doc = `requirementDiagram
      accTitle: ${expectedTitle}
      accDescr {
        ${expectedAccDescription}
      }
      element test_name {
      type: test_type
      docref: test_ref
      }`;

    reqDiagram.parser.parse(doc);

    expect(requirementDb.getAccTitle()).toBe(expectedTitle);
    expect(requirementDb.getAccDescription()).toBe(expectedAccDescription);
  });

  it('will accept full relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.CONTAINS;

    const lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    expect(requirementDb.getRequirements().size).toBe(0);
    expect(requirementDb.getElements().size).toBe(0);
    expect(Object.keys(requirementDb.getRelationships()).length).toBe(1);

    const foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.src).toBe(expectedSrc);
    expect(foundRelationship.dst).toBe(expectedDest);
  });

  it('will accept "requirement" type of requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = requirementDb.RequirementType.REQUIREMENT;
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `requirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.type).toBe(expectedType);
  });

  it('will accept "functionalRequirement" type of requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = requirementDb.RequirementType.FUNCTIONAL_REQUIREMENT;
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `functionalRequirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.type).toBe(expectedType);
  });

  it('will accept "interfaceRequirement" type of requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = requirementDb.RequirementType.INTERFACE_REQUIREMENT;
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `interfaceRequirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.type).toBe(expectedType);
  });

  it('will accept "performanceRequirement" type of requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = requirementDb.RequirementType.PERFORMANCE_REQUIREMENT;
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `performanceRequirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.type).toBe(expectedType);
  });

  it('will accept "physicalRequirement" type of requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = requirementDb.RequirementType.PHYSICAL_REQUIREMENT;
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `physicalRequirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.type).toBe(expectedType);
  });

  it('will accept "designConstraint" type of requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = requirementDb.RequirementType.DESIGN_CONSTRAINT;
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `designConstraint ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.type).toBe(expectedType);
  });

  it('will accept "low" type of risk requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = 'designConstraint';
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.LOW_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.risk).toBe(expectedRisk);
  });

  it('will accept "medium" type of risk requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = 'designConstraint';
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.MED_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.risk).toBe(expectedRisk);
  });

  it('will accept "high" type of risk requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = 'designConstraint';
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.risk).toBe(expectedRisk);
  });

  it('will accept "Analysis" type of verification method requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = 'designConstraint';
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_ANALYSIS;

    const lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.verifyMethod).toBe(expectedVerifyMethod);
  });

  it('will accept "Inspection" type of verification method requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = 'designConstraint';
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_INSPECTION;

    const lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.verifyMethod).toBe(expectedVerifyMethod);
  });

  it('will accept "Test" type of verification method requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = 'designConstraint';
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_TEST;

    const lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.verifyMethod).toBe(expectedVerifyMethod);
  });

  it('will accept "Demonstration" type of verification method requirement definition', function () {
    const expectedName = 'test_req';
    const expectedType = requirementDb.RequirementType.DESIGN_CONSTRAINT;
    const expectedId = 'test_id';
    const expectedText = 'the test text.';
    const expectedRisk = requirementDb.RiskLevel.HIGH_RISK;
    const expectedVerifyMethod = requirementDb.VerifyType.VERIFY_DEMONSTRATION;

    const lines = [
      `requirementDiagram`,
      ``,
      `designConstraint ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    expect(foundReq).toBeDefined();
    expect(foundReq.verifyMethod).toBe(expectedVerifyMethod);
  });

  it('will accept contains relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.CONTAINS;

    const lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept copies relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.COPIES;

    const lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept derives relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.DERIVES;

    const lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept satisfies relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.SATISFIES;

    const lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept verifies relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.VERIFIES;

    const lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept refines relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.REFINES;

    const lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept traces relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.TRACES;

    const lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  for (const property of ['__proto__', 'constructor']) {
    it(`will accept ${property} as requirement id`, function () {
      reqDiagram.parser.parse(`requirementDiagram
      requirement ${property} {
        id: 1
        text: the test text.
        risk: high
        verifymethod: test
      }`);
      expect(reqDiagram.parser.yy.getRequirements().size).toBe(1);
    });

    it(`will accept ${property} as element id`, function () {
      reqDiagram.parser.parse(`requirementDiagram
      element ${property} {
        type: simulation
      }`);
      expect(reqDiagram.parser.yy.getElements().size).toBe(1);
    });
  }

  it('will accept styling a requirement', function () {
    const expectedName = 'test_req';

    const lines = [
      `requirementDiagram`,
      ``,
      `requirement ${expectedName} {`,
      `}`,
      `style ${expectedName} fill:#f9f,stroke:#333,stroke-width:4px`,
      ``,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundReq = requirementDb.getRequirements().get(expectedName)!;
    const styles = foundReq.cssStyles;
    expect(styles).toEqual(['fill:#f9f', 'stroke:#333', 'stroke-width:4px']);
  });

  it('will accept styling an element', function () {
    const expectedName = 'test_element';

    const lines = [
      `requirementDiagram`,
      ``,
      `element ${expectedName} {`,
      `}`,
      `style ${expectedName} fill:#f9f,stroke:#333,stroke-width:4px`,
      ``,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundElement = requirementDb.getElements().get(expectedName)!;
    const styles = foundElement.cssStyles;
    expect(styles).toEqual(['fill:#f9f', 'stroke:#333', 'stroke-width:4px']);
  });

  it('will accept styling multiple things at once', function () {
    const expectedRequirementName = 'test_requirement';
    const expectedElementName = 'test_element';

    const lines = [
      `requirementDiagram`,
      ``,
      `requirement ${expectedRequirementName} {`,
      `}`,
      `element ${expectedElementName} {`,
      `}`,
      `style ${expectedRequirementName},${expectedElementName} fill:#f9f,stroke:#333,stroke-width:4px`,
      ``,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRequirement = requirementDb.getRequirements().get(expectedRequirementName)!;
    const requirementStyles = foundRequirement.cssStyles;
    expect(requirementStyles).toEqual(['fill:#f9f', 'stroke:#333', 'stroke-width:4px']);
    const foundElement = requirementDb.getElements().get(expectedElementName)!;
    const elementStyles = foundElement.cssStyles;
    expect(elementStyles).toEqual(['fill:#f9f', 'stroke:#333', 'stroke-width:4px']);
  });

  it('will accept defining a class', function () {
    const expectedName = 'myClass';

    const lines = [
      `requirementDiagram`,
      ``,
      `classDef ${expectedName} fill:#f9f,stroke:#333,stroke-width:4px`,
      ``,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundClass = requirementDb.getClasses().get(expectedName);
    expect(foundClass).toEqual({
      id: 'myClass',
      styles: ['fill:#f9f', 'stroke:#333', 'stroke-width:4px'],
      textStyles: [],
    });
  });

  it('will accept defining multiple classes at once', function () {
    const firstName = 'firstClass';
    const secondName = 'secondClass';

    const lines = [
      `requirementDiagram`,
      ``,
      `classDef ${firstName},${secondName} fill:#f9f,stroke:#333,stroke-width:4px`,
      ``,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const firstClass = requirementDb.getClasses().get(firstName);
    expect(firstClass).toEqual({
      id: 'firstClass',
      styles: ['fill:#f9f', 'stroke:#333', 'stroke-width:4px'],
      textStyles: [],
    });
    const secondClass = requirementDb.getClasses().get(secondName);
    expect(secondClass).toEqual({
      id: 'secondClass',
      styles: ['fill:#f9f', 'stroke:#333', 'stroke-width:4px'],
      textStyles: [],
    });
  });

  it('will accept assigning a class via the class statement', function () {
    const requirementName = 'myReq';
    const className = 'myClass';

    const lines = [
      `requirementDiagram`,
      ``,
      `requirement ${requirementName} {`,
      `}`,
      `classDef ${className} fill:#f9f,stroke:#333,stroke-width:4px`,
      `class ${requirementName} ${className}`,
      ``,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRequirement = requirementDb.getRequirements().get(requirementName)!;
    expect(foundRequirement.classes).toEqual(['default', className]);
  });

  it('will accept assigning multiple classes to multiple things via the class statement', function () {
    const requirementName = 'req';
    const elementName = 'elem';
    const firstClassName = 'class1';
    const secondClassName = 'class2';

    const lines = [
      `requirementDiagram`,
      ``,
      `requirement ${requirementName} {`,
      `}`,
      `element ${elementName} {`,
      `}`,
      `classDef ${firstClassName},${secondClassName} fill:#f9f,stroke:#333,stroke-width:4px`,
      `class ${requirementName},${elementName} ${firstClassName},${secondClassName}`,
      ``,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const requirement = requirementDb.getRequirements().get(requirementName)!;
    expect(requirement.classes).toEqual(['default', firstClassName, secondClassName]);
    const element = requirementDb.getElements().get(elementName)!;
    expect(element.classes).toEqual(['default', firstClassName, secondClassName]);
  });

  it('will accept assigning a class via the shorthand syntax', function () {
    const requirementName = 'myReq';
    const className = 'myClass';

    const lines = [
      `requirementDiagram`,
      ``,
      `requirement ${requirementName} {`,
      `}`,
      `classDef ${className} fill:#f9f,stroke:#333,stroke-width:4px`,
      `${requirementName}:::${className}`,
      ``,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRequirement = requirementDb.getRequirements().get(requirementName)!;
    expect(foundRequirement.classes).toEqual(['default', className]);
  });

  it('will accept assigning multiple classes via the shorthand syntax', function () {
    const requirementName = 'myReq';
    const firstClassName = 'class1';
    const secondClassName = 'class2';

    const lines = [
      `requirementDiagram`,
      ``,
      `requirement ${requirementName} {`,
      `}`,
      `classDef ${firstClassName} fill:#f9f,stroke:#333,stroke-width:4px`,
      `classDef ${secondClassName} color:blue`,
      `${requirementName}:::${firstClassName},${secondClassName}`,
      ``,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRequirement = requirementDb.getRequirements().get(requirementName)!;
    expect(foundRequirement.classes).toEqual(['default', firstClassName, secondClassName]);
  });

  it('will accept assigning a class or multiple via the shorthand syntax when defining a requirement or element', function () {
    const requirementName = 'myReq';
    const elementName = 'myElem';
    const firstClassName = 'class1';
    const secondClassName = 'class2';

    const lines = [
      `requirementDiagram`,
      ``,
      `requirement ${requirementName}:::${firstClassName} {`,
      `}`,
      `element ${elementName}:::${firstClassName},${secondClassName} {`,
      `}`,
      ``,
      `classDef ${firstClassName} fill:#f9f,stroke:#333,stroke-width:4px`,
      `classDef ${secondClassName} color:blue`,
      ``,
    ];
    const doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    const foundRequirement = requirementDb.getRequirements().get(requirementName)!;
    expect(foundRequirement.classes).toEqual(['default', firstClassName]);
    const foundElement = requirementDb.getElements().get(elementName)!;
    expect(foundElement.classes).toEqual(['default', firstClassName, secondClassName]);
  });

  describe('will parse direction statements and', () => {
    test.each(['TB', 'BT', 'LR', 'RL'])('will accept direction %s', (directionVal) => {
      const lines = ['requirementDiagram', '', `direction ${directionVal}`, ''];
      const doc = lines.join('\n');

      reqDiagram.parser.parse(doc);

      const direction = requirementDb.getDirection();
      expect(direction).toBe(directionVal);
    });
  });
});
