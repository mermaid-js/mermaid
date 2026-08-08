import { describe, expect, it } from 'vitest';
import { expectNoErrorsOrAlternatives, domainstorytellingParse as parse } from './test-util.js';
import { DomainStorytelling } from '../src/language/index.js';

describe('domainstorytelling', () => {
  it('should parse title metadata', () => {
    const context = `domainstorytelling-beta\ntitle Domain Storytelling Parser Title\nA_A : 01 -- "works on" -> W_W`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.title).toBe('Domain Storytelling Parser Title');
  });

  it.each([
    `domainstorytelling-beta`,
    `\ndomainstorytelling-beta\n`,
    `domainstorytelling-beta\n\n\nA_A : 01 -- "works on" -> W_W\n`,
    `domainstorytelling-beta\nA_A : 01 -- "works on" -> W_W -- "using" -> W_V`,
    `domainstorytelling-beta\nA_A : 03 -- "hands over" -> W_W -- "to" -> A_B`,
    `domainstorytelling-beta\nA_A : 04 -- "hands over" -> W_W -- "to" -> A_B -- "and" -> A_C`,
    `domainstorytelling-beta\nA_A : 05 -- "collaborates on" -> W_W <- "collaborates on" -- A_B`,
  ])('should parse valid domainstorytelling blocks', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(DomainStorytelling.$type);
  });

  it('should parse multiple SentenceBlocks', () => {
    const context = `domainstorytelling-beta\nA_A : 01 -- "works on" -> W_W\nA_B : 02 -- "reviews" -> W_W`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.sentences.length).toBe(2);
    expect(result.value.sentences[0].noOfSeq).toBe(1);
    expect(result.value.sentences[0].actor).toBe('A_A');
    expect(result.value.sentences[0].workobject).toBe('W_W');
    expect(result.value.sentences[0].activity).toBe('"works on"');
    expect(result.value.sentences[1].noOfSeq).toBe(2);
    expect(result.value.sentences[1].actor).toBe('A_B');
    expect(result.value.sentences[1].workobject).toBe('W_W');
    expect(result.value.sentences[1].activity).toBe('"reviews"');
  });

  it('should handle SentenceBlock with additionalActors', () => {
    const context = `domainstorytelling-beta\nA_A : 04 -- "hands over" -> W_W -- "to" -> A_B -- "and" -> A_C`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const block = result.value.sentences[0];
    expect(block.noOfSeq).toBe(4);
    const first = block.continuations[0];
    const second = block.continuations[1];
    expect(first.$type).toBe('AdditionalActor');
    expect(second.$type).toBe('AdditionalActor');
    if (first.$type !== 'AdditionalActor' || second.$type !== 'AdditionalActor') {
      throw new Error('Expected AdditionalActor continuations');
    }
    expect(first.actor).toBe('A_B');
    expect(first.activity).toBe('"to"');
    expect(second.actor).toBe('A_C');
    expect(second.activity).toBe('"and"');
  });

  it('should handle SentenceBlock with additionalWorkobjects', () => {
    const context = `domainstorytelling-beta\nA_A : 02 -- "works on" -> W_W -- "using" -> W_V -- "and" -> W_X`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const block = result.value.sentences[0];
    expect(block.noOfSeq).toBe(2);
    const first = block.continuations[0];
    const second = block.continuations[1];
    expect(first.$type).toBe('AdditionalWorkObject');
    expect(second.$type).toBe('AdditionalWorkObject');
    if (first.$type !== 'AdditionalWorkObject' || second.$type !== 'AdditionalWorkObject') {
      throw new Error('Expected AdditionalWorkObject continuations');
    }
    expect(first.workobject).toBe('W_V');
    expect(first.activity).toBe('"using"');
    expect(second.workobject).toBe('W_X');
    expect(second.activity).toBe('"and"');
  });

  it('should handle SentenceBlock with reverse arrow', () => {
    const context = `domainstorytelling-beta\nA_A : 05 -- "collaborates on" -> W_W <- "collaborates on" -- A_B`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const block = result.value.sentences[0];
    expect(block.actor).toBe('A_A');
    const first = block.continuations[0];
    expect(first.$type).toBe('ReverseActor');
    if (first.$type !== 'ReverseActor') {
      throw new Error('Expected ReverseActor continuation');
    }
    expect(first.actor).toBe('A_B');
    expect(first.activity).toBe('"collaborates on"');
  });

  it('should parse mixed continuation ordering in one sentence', () => {
    const context =
      'domainstorytelling-beta\nA_A : 01 -- "aligns on" -> W_Plan -- "and" -> W_TestPlan -- "with" -> A_C';
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const block = result.value.sentences[0];
    expect(block.continuations).toHaveLength(2);
    const first = block.continuations[0];
    const second = block.continuations[1];
    expect(first.$type).toBe('AdditionalWorkObject');
    expect(second.$type).toBe('AdditionalActor');
    if (first.$type !== 'AdditionalWorkObject' || second.$type !== 'AdditionalActor') {
      throw new Error('Unexpected continuation ordering');
    }
    expect(first.workobject).toBe('W_TestPlan');
    expect(second.actor).toBe('A_C');
  });

  it('should parse icon in actor declaration', () => {
    const context = `domainstorytelling-beta
A_Customer mdi:account
A_Customer : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const astAny = result.value as unknown as {
      actorDeclarations?: { actor: string; icon?: string }[];
    };
    expect(astAny.actorDeclarations).toHaveLength(1);
    expect(astAny.actorDeclarations?.[0]?.actor).toBe('A_Customer');
    expect(astAny.actorDeclarations?.[0]?.icon).toBe('mdi:account');
  });

  it('should parse icon in workobject declaration', () => {
    const context = `domainstorytelling-beta
W_Order "Order" fa6-solid:cart-shopping
A_Customer : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const astAny = result.value as unknown as {
      workObjectDeclarations?: { workobject: string; label?: string; icon?: string }[];
    };
    expect(astAny.workObjectDeclarations).toHaveLength(1);
    expect(astAny.workObjectDeclarations?.[0]?.workobject).toBe('W_Order');
    expect(astAny.workObjectDeclarations?.[0]?.label).toBe('"Order"');
    expect(astAny.workObjectDeclarations?.[0]?.icon).toBe('fa6-solid:cart-shopping');
  });

  it('should parse prefix-less icon names (built-in pack) with group membership', () => {
    const context = `domainstorytelling-beta
group G_Office "Office"
A_Customer "Customer" person in G_Office
W_Order "Order" document
A_Customer : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const astAny = result.value as unknown as {
      actorDeclarations?: { actor: string; icon?: string; group?: string }[];
      workObjectDeclarations?: { workobject: string; icon?: string }[];
    };
    expect(astAny.actorDeclarations?.[0]?.icon).toBe('person');
    expect(astAny.actorDeclarations?.[0]?.group).toBe('G_Office');
    expect(astAny.workObjectDeclarations?.[0]?.icon).toBe('document');
  });

  it('should keep title lines intact alongside prefix-less icon names', () => {
    // Regression guard: prefix-less icons parse via the common ID terminal,
    // which is ordered after TITLE — a bare-word terminal declared in the
    // domainstorytelling grammar itself would shadow `title ...` lines.
    const context = `domainstorytelling-beta
title Sell books over the counter
A_Customer person
A_Customer : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const astAny = result.value as unknown as {
      title?: string;
      actorDeclarations?: { actor: string; icon?: string }[];
    };
    expect(astAny.title).toBe('Sell books over the counter');
    expect(astAny.actorDeclarations?.[0]?.icon).toBe('person');
  });

  it('should allow underscores inside actor, workobject, and group ids', () => {
    const context = `domainstorytelling-beta
group G_Back_Office "Back Office"
A_Service_Clerk "Clerk" in G_Back_Office
W_Purchase_Order "Order"
A_Service_Clerk : 01 -- "files" -> W_Purchase_Order id S_File_Order`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const astAny = result.value as unknown as {
      groupDefinitions?: { id: string }[];
      actorDeclarations?: { actor: string; group?: string }[];
      workObjectDeclarations?: { workobject: string }[];
    };
    expect(astAny.groupDefinitions?.[0]?.id).toBe('G_Back_Office');
    expect(astAny.actorDeclarations?.[0]?.actor).toBe('A_Service_Clerk');
    expect(astAny.actorDeclarations?.[0]?.group).toBe('G_Back_Office');
    expect(astAny.workObjectDeclarations?.[0]?.workobject).toBe('W_Purchase_Order');
    expect(result.value.sentences[0].workobject).toBe('W_Purchase_Order');
    expect(result.value.sentences[0].sentenceId).toBe('S_File_Order');
  });

  it('should not absorb dashes into ids', () => {
    // Dashes stay out of the id terminals: a `--` written without a leading
    // space would otherwise be lexed as part of the preceding id.
    const result = parse(`domainstorytelling-beta\nA_A : 01 -- "x" -> W_Order-Item`);
    expect(result.lexerErrors.length + result.parserErrors.length).toBeGreaterThan(0);
  });

  it('should fail on invalid syntax', () => {
    const context = `domainstorytelling-beta\nA_A 01 -- "works on" -> W_W`;
    const result = parse(context);
    expect(result.parserErrors.length).toBeGreaterThan(0);
  });

  it('should parse a group definition without title', () => {
    const context = `domainstorytelling-beta\ngroup G_Backend\nA_A : 01 -- "works on" -> W_W`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const astAny = result.value as unknown as {
      groupDefinitions?: { id: string; title?: string; parent?: string }[];
    };
    expect(astAny.groupDefinitions).toHaveLength(1);
    expect(astAny.groupDefinitions?.[0]?.id).toBe('G_Backend');
    expect(astAny.groupDefinitions?.[0]?.title).toBeUndefined();
    expect(astAny.groupDefinitions?.[0]?.parent).toBeUndefined();
  });

  it('should parse a group definition with a title', () => {
    const context = `domainstorytelling-beta\ngroup G_Backend "Backend"\nA_A : 01 -- "works on" -> W_W`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const astAny = result.value as unknown as {
      groupDefinitions?: { id: string; title?: string; parent?: string }[];
    };
    expect(astAny.groupDefinitions).toHaveLength(1);
    expect(astAny.groupDefinitions?.[0]?.id).toBe('G_Backend');
    expect(astAny.groupDefinitions?.[0]?.title).toBe('"Backend"');
  });

  it('should parse a nested group definition (in parent)', () => {
    const context = `domainstorytelling-beta\ngroup G_Outer "Outer"\ngroup G_Inner "Inner" in G_Outer\nA_A : 01 -- "works on" -> W_W`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const astAny = result.value as unknown as {
      groupDefinitions?: { id: string; title?: string; parent?: string }[];
    };
    expect(astAny.groupDefinitions).toHaveLength(2);
    expect(astAny.groupDefinitions?.[1]?.id).toBe('G_Inner');
    expect(astAny.groupDefinitions?.[1]?.parent).toBe('G_Outer');
  });

  it('should parse actor declaration with group only (membership)', () => {
    const context = `domainstorytelling-beta\ngroup G_Frontend "Frontend"\nA_Customer in G_Frontend\nA_Customer : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const astAny = result.value as unknown as {
      groupDefinitions?: { id: string }[];
      actorDeclarations?: { actor: string; icon?: string; group?: string }[];
    };
    expect(astAny.groupDefinitions).toHaveLength(1);
    expect(astAny.actorDeclarations).toHaveLength(1);
    expect(astAny.actorDeclarations?.[0]?.actor).toBe('A_Customer');
    expect(astAny.actorDeclarations?.[0]?.group).toBe('G_Frontend');
    expect(astAny.actorDeclarations?.[0]?.icon).toBeUndefined();
  });

  it('should parse multiple actor declarations across multiple groups', () => {
    const context = `domainstorytelling-beta\ngroup G_A "A"\ngroup G_B "B"\nA_X in G_A\nA_Y in G_B\nA_X : 01 -- "works on" -> W_W`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const astAny = result.value as unknown as {
      actorDeclarations?: { actor: string; icon?: string; group?: string }[];
    };
    expect(astAny.actorDeclarations).toHaveLength(2);
    expect(astAny.actorDeclarations?.[0]).toMatchObject({ actor: 'A_X', group: 'G_A' });
    expect(astAny.actorDeclarations?.[1]).toMatchObject({ actor: 'A_Y', group: 'G_B' });
  });

  it('should parse actor declaration with icon only', () => {
    const context = `domainstorytelling-beta\nA_Customer fa:fa-user\nA_Customer : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const astAny = result.value as unknown as {
      actorDeclarations?: { actor: string; icon?: string; group?: string }[];
    };
    expect(astAny.actorDeclarations).toHaveLength(1);
    expect(astAny.actorDeclarations?.[0]?.actor).toBe('A_Customer');
    expect(astAny.actorDeclarations?.[0]?.icon).toBe('fa:fa-user');
    expect(astAny.actorDeclarations?.[0]?.group).toBeUndefined();
  });

  it('should parse actor declaration with icon and group combined', () => {
    const context = `domainstorytelling-beta\ngroup G_Frontend "Frontend"\nA_Customer fa:fa-user in G_Frontend\nA_Customer : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const astAny = result.value as unknown as {
      actorDeclarations?: { actor: string; icon?: string; group?: string }[];
    };
    expect(astAny.actorDeclarations).toHaveLength(1);
    expect(astAny.actorDeclarations?.[0]?.actor).toBe('A_Customer');
    expect(astAny.actorDeclarations?.[0]?.icon).toBe('fa:fa-user');
    expect(astAny.actorDeclarations?.[0]?.group).toBe('G_Frontend');
  });

  it('should parse actor declaration with label containing spaces', () => {
    const context = `domainstorytelling-beta\nA_Customer "Customer Service Team"\nA_Customer : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const astAny = result.value as unknown as {
      actorDeclarations?: { actor: string; label?: string }[];
    };
    expect(astAny.actorDeclarations).toHaveLength(1);
    expect(astAny.actorDeclarations?.[0]?.actor).toBe('A_Customer');
    expect(astAny.actorDeclarations?.[0]?.label).toBe('"Customer Service Team"');
  });

  it('should parse workobject declaration with label containing spaces', () => {
    const context = `domainstorytelling-beta\nW_Order "Customer Purchase Order"\nA_Customer : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    const astAny = result.value as unknown as {
      workObjectDeclarations?: { workobject: string; label: string }[];
    };
    expect(astAny.workObjectDeclarations).toHaveLength(1);
    expect(astAny.workObjectDeclarations?.[0]?.workobject).toBe('W_Order');
    expect(astAny.workObjectDeclarations?.[0]?.label).toBe('"Customer Purchase Order"');
  });

  it('should fail when actor label is used inside a sentence', () => {
    const context = `domainstorytelling-beta\nA_Customer "Customer Service" : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expect(result.parserErrors.length).toBeGreaterThan(0);
  });

  it('should fail when workobject label is used inside a sentence', () => {
    const context = `domainstorytelling-beta\nA_Customer : 01 -- "places" -> W_Order "Purchase Order"`;
    const result = parse(context);
    expect(result.parserErrors.length).toBeGreaterThan(0);
  });

  it('should parse optional inline group assignment for main workobject', () => {
    const context = `domainstorytelling-beta
group G_Backend "Backend"
A_A : 01 -- "creates" -> W_Order in G_Backend`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const block = result.value.sentences[0] as unknown as { workobject: string; group?: string };
    expect(block.workobject).toBe('W_Order');
    expect(block.group).toBe('G_Backend');
  });

  it('should parse optional inline group assignment for additional workobjects', () => {
    const context = `domainstorytelling-beta
group G_Backend "Backend"
A_A : 01 -- "creates" -> W_Order -- "packs" -> W_Package in G_Backend`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const block = result.value.sentences[0] as unknown as {
      continuations: { $type: string; workobject?: string; group?: string }[];
    };
    expect(block.continuations).toHaveLength(1);
    expect(block.continuations[0]).toMatchObject({
      $type: 'AdditionalWorkObject',
      workobject: 'W_Package',
      group: 'G_Backend',
    });
  });

  it('should parse group blocks with nested sentences', () => {
    const context = `domainstorytelling-beta
group G_Backend "Backend" {
  A_A : 01 -- "creates" -> W_Order
  A_A : 02 -- "packs" -> W_Package
}`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const astAny = result.value as unknown as {
      groupBlocks?: { id: string; title?: string; sentences?: { noOfSeq: number }[] }[];
    };
    expect(astAny.groupBlocks).toHaveLength(1);
    expect(astAny.groupBlocks?.[0]?.id).toBe('G_Backend');
    expect(astAny.groupBlocks?.[0]?.title).toBe('"Backend"');
    expect(astAny.groupBlocks?.[0]?.sentences).toHaveLength(2);
    expect(astAny.groupBlocks?.[0]?.sentences?.[0]?.noOfSeq).toBe(1);
    expect(astAny.groupBlocks?.[0]?.sentences?.[1]?.noOfSeq).toBe(2);
  });

  it('should fail on legacy F_ group identifier prefix', () => {
    const context = `domainstorytelling-beta\ngroup F_Backend\nA_A : 01 -- "works on" -> W_W`;
    const result = parse(context);
    expect(result.parserErrors.length).toBeGreaterThan(0);
  });

  it('should fail on legacy standalone icon syntax', () => {
    const context = `domainstorytelling-beta\nicon A_Customer fa:fa-user\nA_Customer : 01 -- "places" -> W_Order`;
    const result = parse(context);
    expect(result.parserErrors.length + result.lexerErrors.length).toBeGreaterThan(0);
  });

  it('should parse sentence with optional sentence id at end', () => {
    const context = `domainstorytelling-beta\nA_A : 01 -- "works on" -> W_W id S_WorksOn`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const block = result.value.sentences[0] as unknown as { sentenceId?: string };
    expect(block.sentenceId).toBe('S_WorksOn');
  });

  it('should parse actor/group/sentence/workobject annotations', () => {
    const context = `domainstorytelling-beta
group G_Backend "Backend"
A_A : 01 -- "works on" -> W_W id S_Work
annotate actor A_A "Actor comment"
annotate group G_Backend "Group comment"
annotate sentence 01 "Sentence comment"
annotate sentence S_Work "Sentence-by-id comment"
annotate workobject W_W@01 "Workobject-by-seq comment"
annotate workobject W_W@S_Work "Workobject-by-id comment"`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const astAny = result.value as unknown as {
      annotations?: {
        actor?: string;
        group?: string;
        noOfSeq?: number;
        sentenceId?: string;
        workobject?: string;
        workobjectSeqNo?: number;
        workobjectSentenceId?: string;
        body: string;
      }[];
    };

    expect(astAny.annotations).toHaveLength(6);
    expect(astAny.annotations?.[0]).toMatchObject({ actor: 'A_A', body: '"Actor comment"' });
    expect(astAny.annotations?.[1]).toMatchObject({
      group: 'G_Backend',
      body: '"Group comment"',
    });
    expect(astAny.annotations?.[2]).toMatchObject({ noOfSeq: 1, body: '"Sentence comment"' });
    expect(astAny.annotations?.[3]).toMatchObject({
      sentenceId: 'S_Work',
      body: '"Sentence-by-id comment"',
    });
    expect(astAny.annotations?.[4]).toMatchObject({
      workobject: 'W_W',
      workobjectSeqNo: 1,
      body: '"Workobject-by-seq comment"',
    });
    expect(astAny.annotations?.[5]).toMatchObject({
      workobject: 'W_W',
      workobjectSentenceId: 'S_Work',
      body: '"Workobject-by-id comment"',
    });
  });

  it('should parse annotations without rendering side hint syntax', () => {
    const context = `domainstorytelling-beta
A_A : 01 -- "works on" -> W_W
annotate actor A_A "Note"`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const astAny = result.value as unknown as {
      annotations?: { actor?: string; body: string }[];
    };

    expect(astAny.annotations).toHaveLength(1);
    expect(astAny.annotations?.[0]).toMatchObject({ actor: 'A_A', body: '"Note"' });
  });

  it('should parse a multiline quoted annotation body', () => {
    const context = `domainstorytelling-beta
A_A : 01 -- "works on" -> W_W
annotate actor A_A "line one
line two"`;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);

    const astAny = result.value as unknown as {
      annotations?: { actor?: string; body: string }[];
    };

    expect(astAny.annotations).toHaveLength(1);
    expect(astAny.annotations?.[0]).toMatchObject({
      actor: 'A_A',
      body: '"line one\nline two"',
    });
  });
});
