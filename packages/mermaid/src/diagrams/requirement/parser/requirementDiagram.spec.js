import { setConfig } from '../../../config.js';
import requirementDb from '../requirementDb.js';
import reqDiagram from './requirementDiagram.js';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing requirement diagram it...', function () {
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

    let lines = [
      `requirementDiagram`,
      ``,
      `requirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    expect(Object.keys(requirementDb.getRequirements()).length).toBe(1);

    let foundReq = requirementDb.getRequirements()[expectedName];
    expect(foundReq).toBeDefined();
    expect(foundReq.id).toBe(expectedId);
    expect(foundReq.text).toBe(expectedText);

    expect(Object.keys(requirementDb.getElements()).length).toBe(0);
    expect(Object.keys(requirementDb.getRelationships()).length).toBe(0);
  });

  it('will accept full element definition', function () {
    const expectedName = 'test_el';
    const expectedType = 'test_type';
    const expectedDocRef = 'test_ref';

    let lines = [
      `requirementDiagram`,
      ``,
      `element ${expectedName} {`,
      `type: ${expectedType}`,
      `docref: ${expectedDocRef}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    expect(Object.keys(requirementDb.getRequirements()).length).toBe(0);
    expect(Object.keys(requirementDb.getElements()).length).toBe(1);

    let foundElement = requirementDb.getElements()[expectedName];
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

    let lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    expect(Object.keys(requirementDb.getRequirements()).length).toBe(0);
    expect(Object.keys(requirementDb.getElements()).length).toBe(0);
    expect(Object.keys(requirementDb.getRelationships()).length).toBe(1);

    let foundRelationship = requirementDb.getRelationships()[0];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `requirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `functionalRequirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `interfaceRequirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `performanceRequirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `physicalRequirement ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `designConstraint ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `${expectedType} ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
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

    let lines = [
      `requirementDiagram`,
      ``,
      `designConstraint ${expectedName} {`,
      `id: ${expectedId}`,
      `text: ${expectedText}`,
      `risk: ${expectedRisk}`,
      `verifymethod: ${expectedVerifyMethod}`,
      `}`,
    ];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundReq = requirementDb.getRequirements()[expectedName];
    expect(foundReq).toBeDefined();
    expect(foundReq.verifyMethod).toBe(expectedVerifyMethod);
  });

  it('will accept contains relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.CONTAINS;

    let lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept copies relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.COPIES;

    let lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept derives relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.DERIVES;

    let lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept satisfies relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.SATISFIES;

    let lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept verifies relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.VERIFIES;

    let lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept refines relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.REFINES;

    let lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });

  it('will accept traces relationship definition', function () {
    const expectedSrc = 'a';
    const expectedDest = 'b';
    const expectedType = requirementDb.Relationships.TRACES;

    let lines = [`requirementDiagram`, ``, `${expectedSrc} - ${expectedType} -> ${expectedDest}`];
    let doc = lines.join('\n');

    reqDiagram.parser.parse(doc);

    let foundRelationship = requirementDb.getRelationships()[0];
    expect(foundRelationship.type).toBe(expectedType);
  });
});
