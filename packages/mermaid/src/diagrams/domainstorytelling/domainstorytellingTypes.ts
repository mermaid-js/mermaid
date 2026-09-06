import type { DiagramDB } from '../../diagram-api/types.js';
import type { DomainStorytellingGroup } from './domainstorytellingDb.js';

// Domain Storytelling diagram types
export * from './domainstorytellingDb.js';

export interface DomainstorytellingDB extends DiagramDB {
  // common db
  clear: () => void;

  // diagram db
  addIconDefinition: (target: string, icon: string) => void;
  getIcon: (target: string) => string | undefined;
  addActor: (id: string, label?: string) => void;
  addWorkobject: (id: string, label?: string, iconTarget?: string) => void;
  addEdge: (
    from: string,
    to: string,
    label: string,
    noOfSeq?: number,
    sentenceRef?: string
  ) => void;
  addGroup: (id: string, title?: string, parentId?: string) => void;
  setActorGroup: (actorId: string, groupId: string) => void;
  setWorkobjectGroup: (workobjectId: string, groupId: string) => void;
  pruneUnknownGroupReferences: () => void;
  getGroups: () => DomainStorytellingGroup[];
  hasActor: (id: string) => boolean;
  hasWorkobject: (id: string) => boolean;
  hasGroup: (id: string) => boolean;
  setActorComment: (id: string, comment: string) => void;
  setWorkobjectComment: (id: string, comment: string) => void;
  setGroupComment: (id: string, comment: string) => void;
  setSentenceComment: (sentenceRef: string, comment: string) => void;
  setSentenceTarget: (sentenceRef: string, targetId: string) => void;
  getActorComment: (id: string) => string | undefined;
  getWorkobjectComment: (id: string) => string | undefined;
  getGroupComment: (id: string) => string | undefined;
  getSentenceComment: (sentenceRef: string) => string | undefined;
  getSentenceTarget: (sentenceRef: string) => string | undefined;
}
