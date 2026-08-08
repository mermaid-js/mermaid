// Domain Storytelling diagram parser using Langium-generated parser
import { DomainStorytellingDb } from './domainstorytellingDb.js';
import type { DomainStorytelling } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { DiagramDB, ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import type { DomainstorytellingDB } from './domainstorytellingTypes.js';

const generateWorkobjectId = (name: string, sentenceIdx: number, sentenceId?: string) =>
  sentenceId ? `${name}-${sentenceId}` : `${name}-${sentenceIdx}`;

const buildSentenceRef = (sentence: { noOfSeq: number; sentenceId?: string }) =>
  sentence.sentenceId ?? `#${sentence.noOfSeq}`;

const stripQuotes = (text: string) => {
  if (!text) {
    return text;
  }
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
};

interface DomainStorytellingSentenceLike {
  actor: string;
  noOfSeq: number;
  sentenceId?: string;
  activity: string;
  workobject: string;
  group?: string;
  continuations?: DomainStorytellingContinuationLike[];
}

interface AdditionalWorkObjectLike {
  $type: 'AdditionalWorkObject';
  activity: string;
  workobject: string;
  group?: string;
}
interface AdditionalActorLike {
  $type: 'AdditionalActor';
  activity: string;
  actor: string;
}
interface ReverseActorLike {
  $type: 'ReverseActor';
  activity: string;
  actor: string;
}
type DomainStorytellingContinuationLike =
  | AdditionalWorkObjectLike
  | AdditionalActorLike
  | ReverseActorLike;

interface DeclaredLabels {
  actorLabels: Map<string, string>;
  workobjectLabels: Map<string, string>;
}

interface ProcessedSentenceRef {
  noOfSeq: number;
  sentenceId?: string;
  workobjectNodeIds: Map<string, string[]>;
}

const processSentence = (
  block: DomainStorytellingSentenceLike,
  db: DomainstorytellingDB,
  labels: DeclaredLabels,
  defaultWorkobjectGroup?: string
): ProcessedSentenceRef => {
  const sentenceRef = buildSentenceRef(block);
  const workobjectNodeIds = new Map<string, string[]>();
  const registerWorkobjectNodeId = (workobjectName: string, nodeId: string) => {
    const existingIds = workobjectNodeIds.get(workobjectName);
    if (existingIds) {
      existingIds.push(nodeId);
      return;
    }
    workobjectNodeIds.set(workobjectName, [nodeId]);
  };

  db.addActor(block.actor, labels.actorLabels.get(block.actor));

  const workobjectId = generateWorkobjectId(block.workobject, block.noOfSeq, block.sentenceId);
  db.addWorkobject(workobjectId, labels.workobjectLabels.get(block.workobject), block.workobject);
  registerWorkobjectNodeId(block.workobject, workobjectId);
  const mainGroup = block.group ?? defaultWorkobjectGroup;
  if (mainGroup) {
    db.setWorkobjectGroup(workobjectId, mainGroup);
  }
  db.setSentenceTarget(sentenceRef, block.actor);

  // Edge: Actor -> Workobject
  db.addEdge(block.actor, workobjectId, stripQuotes(block.activity), block.noOfSeq, sentenceRef);

  // Continuation segments are consumed in source order.
  // Actor/reverse segments stay anchored to the latest workobject node.
  let latestWorkobjectId = workobjectId;

  for (const continuation of block.continuations ?? []) {
    switch (continuation.$type) {
      case 'AdditionalWorkObject': {
        const additionalId = generateWorkobjectId(
          continuation.workobject,
          block.noOfSeq,
          block.sentenceId
        );
        db.addWorkobject(
          additionalId,
          labels.workobjectLabels.get(continuation.workobject),
          continuation.workobject
        );
        registerWorkobjectNodeId(continuation.workobject, additionalId);
        const additionalGroup = continuation.group ?? defaultWorkobjectGroup;
        if (additionalGroup) {
          db.setWorkobjectGroup(additionalId, additionalGroup);
        }
        db.addEdge(
          latestWorkobjectId,
          additionalId,
          stripQuotes(continuation.activity),
          undefined,
          sentenceRef
        );
        latestWorkobjectId = additionalId;
        break;
      }
      case 'ReverseActor': {
        db.addActor(continuation.actor, labels.actorLabels.get(continuation.actor));
        // Reverse arrows inherit the sentence's seqNo only while they still anchor
        // to its main workobject: AdditionalWorkObject advances that pointer,
        // AdditionalActor doesn't.
        db.addEdge(
          continuation.actor,
          latestWorkobjectId,
          stripQuotes(continuation.activity),
          latestWorkobjectId === workobjectId ? block.noOfSeq : undefined,
          sentenceRef
        );
        break;
      }
      case 'AdditionalActor': {
        db.addActor(continuation.actor, labels.actorLabels.get(continuation.actor));
        db.addEdge(
          latestWorkobjectId,
          continuation.actor,
          stripQuotes(continuation.activity),
          undefined,
          sentenceRef
        );
        break;
      }
      default: {
        const exhaustive: never = continuation;
        throw new Error(
          `[DomainStorytelling] Unhandled continuation type: ${JSON.stringify(exhaustive)}`
        );
      }
    }
  }

  return {
    noOfSeq: block.noOfSeq,
    sentenceId: block.sentenceId,
    workobjectNodeIds,
  };
};

const populateDb = (ast: DomainStorytelling, db: DomainstorytellingDB) => {
  // Populate common diagram metadata (title, accessibility fields).
  populateCommonDb(ast, db);
  log.debug(ast);

  const processedSentences: ProcessedSentenceRef[] = [];

  const labels: DeclaredLabels = {
    actorLabels: new Map<string, string>(),
    workobjectLabels: new Map<string, string>(),
  };

  const setDeclaredLabel = (target: Map<string, string>, id: string, rawLabel?: string) => {
    const normalized = rawLabel ? stripQuotes(rawLabel) : undefined;
    if (!normalized) {
      return;
    }

    const existing = target.get(id);
    if (existing && existing !== normalized) {
      log.warn(
        `[DomainStorytelling] Conflicting declaration label for '${id}'. Keeping '${existing}' and ignoring '${normalized}'.`
      );
      return;
    }

    target.set(id, normalized);
  };
  // Process group definitions: declare named groups with optional title and parent
  if (ast.groupDefinitions) {
    ast.groupDefinitions.forEach((fd) => {
      db.addGroup(fd.id, fd.title ? stripQuotes(fd.title) : undefined, fd.parent);
    });
  }

  // Process actor declarations: optional icon and/or group membership
  if (ast.actorDeclarations) {
    ast.actorDeclarations.forEach((ad) => {
      setDeclaredLabel(labels.actorLabels, ad.actor, ad.label);
      if (ad.icon) {
        db.addIconDefinition(ad.actor, ad.icon);
      }
      if (ad.group) {
        db.setActorGroup(ad.actor, ad.group);
      }
    });
  }

  // Process workobject declarations: labels are declared here, sentence usage remains ID-only.
  if (ast.workObjectDeclarations) {
    ast.workObjectDeclarations.forEach((wd) => {
      setDeclaredLabel(labels.workobjectLabels, wd.workobject, wd.label);
      if (wd.icon) {
        db.addIconDefinition(wd.workobject, wd.icon);
      }
    });
  }

  // Process group blocks after declarations so sentence rendering can pick up declared labels.
  if (ast.groupBlocks) {
    ast.groupBlocks.forEach((groupBlock) => {
      db.addGroup(
        groupBlock.id,
        groupBlock.title ? stripQuotes(groupBlock.title) : undefined,
        groupBlock.parent
      );

      for (const sentence of groupBlock.sentences ?? []) {
        processedSentences.push(processSentence(sentence, db, labels, groupBlock.id));
      }
    });
  }

  if (ast.sentences) {
    ast.sentences.forEach((block) => processedSentences.push(processSentence(block, db, labels)));
  }

  const resolveSentenceRef = ({
    noOfSeq,
    sentenceId,
  }: {
    noOfSeq?: number;
    sentenceId?: string;
  }) => {
    if (sentenceId) {
      const byId = processedSentences.filter((ref) => ref.sentenceId === sentenceId);
      if (byId.length === 0) {
        throw new Error(
          `[DomainStorytelling] Unknown sentence reference '${sentenceId}'. Add a matching 'id ${sentenceId}' to the target sentence.`
        );
      }
      if (byId.length > 1) {
        throw new Error(
          `[DomainStorytelling] Duplicate sentence ID '${sentenceId}'. Sentence IDs must be unique.`
        );
      }
      return byId[0];
    }

    if (noOfSeq === undefined) {
      throw new Error(
        '[DomainStorytelling] Missing sentence reference. Provide a seqNo or a sentence ID.'
      );
    }

    const bySeqNo = processedSentences.filter((ref) => ref.noOfSeq === noOfSeq);
    if (bySeqNo.length === 0) {
      throw new Error(`[DomainStorytelling] Unknown sentence sequence number '${noOfSeq}'.`);
    }
    if (bySeqNo.length > 1) {
      throw new Error(
        `[DomainStorytelling] Ambiguous sentence sequence number '${noOfSeq}'. Use explicit sentence IDs and annotate by 'S_...'.`
      );
    }
    return bySeqNo[0];
  };

  if (ast.annotations) {
    ast.annotations.forEach((annotation) => {
      const body = stripQuotes(annotation.body).trim();

      if (annotation.actor) {
        if (!db.hasActor(annotation.actor)) {
          throw new Error(
            `[DomainStorytelling] Unknown actor '${annotation.actor}' in annotation.`
          );
        }
        db.setActorComment(annotation.actor, body);
        return;
      }

      if (annotation.group) {
        if (!db.hasGroup(annotation.group)) {
          throw new Error(
            `[DomainStorytelling] Unknown group '${annotation.group}' in annotation.`
          );
        }
        db.setGroupComment(annotation.group, body);
        return;
      }

      if (annotation.workobject) {
        const sentenceRef = resolveSentenceRef({
          noOfSeq: annotation.workobjectSeqNo,
          sentenceId: annotation.workobjectSentenceId,
        });
        const nodeIds = sentenceRef.workobjectNodeIds.get(annotation.workobject);
        if (!nodeIds || nodeIds.length === 0) {
          throw new Error(
            `[DomainStorytelling] Unknown workobject '${annotation.workobject}' for the selected sentence reference in annotation.`
          );
        }
        if (nodeIds.length > 1) {
          throw new Error(
            `[DomainStorytelling] Ambiguous workobject '${annotation.workobject}' in sentence. Ensure it appears once for this sentence before annotating.`
          );
        }
        db.setWorkobjectComment(nodeIds[0], body);
        return;
      }

      const sentenceRef = resolveSentenceRef({
        noOfSeq: annotation.noOfSeq,
        sentenceId: annotation.sentenceId,
      });
      db.setSentenceComment(buildSentenceRef(sentenceRef), body);
    });
  }

  // Prune only after all declarations/blocks/sentences are processed so order stays flexible.
  db.pruneUnknownGroupReferences();
};

export const parser: ParserDefinition = {
  parser: {
    // yy is set externally to a DomainStorytellingDb instance before parse() runs.
    yy: undefined as unknown as DiagramDB,
  },
  parse: async (input: string): Promise<void> => {
    const ast: DomainStorytelling = await parse('domainstorytelling', input);
    log.debug(ast);
    const db = parser.parser?.yy;
    if (!(db instanceof DomainStorytellingDb)) {
      throw new Error(
        'parser.parser?.yy was not a DomainStorytellingDb. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }
    populateDb(ast, db);
  },
};
