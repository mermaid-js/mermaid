import { log } from '../../logger.js';
import type { DomainstorytellingDB } from './domainstorytellingTypes.js';

/**
 * When no explicit label is declared, fall back to the identifier without its
 * domain prefix (`A_`/`W_`/`G_`) so diagrams show "Customer" instead of
 * "A_Customer". Ids without a known prefix are returned unchanged.
 */
export const stripDomainPrefix = (name: string): string => name.replace(/^[AWG]_/u, '');

export interface DomainStorytellingGroup {
  id: string;
  title?: string;
  parentId?: string;
}

export interface DomainStorytellingActor {
  id: string;
  label: string;
  icon?: string;
  group?: string;
}

export interface DomainStorytellingWorkobject {
  id: string;
  label: string;
  icon?: string;
  group?: string;
}

export interface DomainStorytellingEdge {
  from: string;
  to: string;
  label: string;
  noOfSeq?: number;
  sentenceRef?: string;
}

/**
 * Holds everything parsed from a Domain Storytelling diagram: actors,
 * workobjects, edges, groups, and annotations.
 */
export class DomainStorytellingDb implements DomainstorytellingDB {
  // Arrays preserve insertion order for the renderer; the parallel id-keyed
  // maps below give O(1) lookups for the add/has/setGroup paths.
  actors: DomainStorytellingActor[] = [];
  workobjects: DomainStorytellingWorkobject[] = [];
  edges: DomainStorytellingEdge[] = [];
  private actorsById = new Map<string, DomainStorytellingActor>();
  private workobjectsById = new Map<string, DomainStorytellingWorkobject>();
  // Pending actor/workobject → group assignments that arrive before the node
  // is added (e.g., `A_A in G_X` declared above the first sentence that uses A_A).
  // Consumed and deleted by addActor / addWorkobject.
  private pendingGroupMemberships = new Map<string, string>();
  private diagramTitle = '';
  private accTitle = '';
  private accDescription = '';
  iconDefinitions: Map<string, string> = new Map<string, string>(); // target -> icon mapping
  groups: Map<string, DomainStorytellingGroup> = new Map<string, DomainStorytellingGroup>();
  actorComments: Map<string, string> = new Map<string, string>();
  workobjectComments: Map<string, string> = new Map<string, string>();
  groupComments: Map<string, string> = new Map<string, string>();
  sentenceComments: Map<string, string> = new Map<string, string>();
  sentenceTargets: Map<string, string> = new Map<string, string>();

  /** Resets every collection plus the title and accessibility fields. */
  clear() {
    this.actors = [];
    this.workobjects = [];
    this.edges = [];
    this.actorsById.clear();
    this.workobjectsById.clear();
    this.diagramTitle = '';
    this.accTitle = '';
    this.accDescription = '';
    this.iconDefinitions.clear();
    this.groups.clear();
    this.actorComments.clear();
    this.workobjectComments.clear();
    this.groupComments.clear();
    this.sentenceComments.clear();
    this.sentenceTargets.clear();
    this.pendingGroupMemberships.clear();
  }

  setDiagramTitle(title: string) {
    this.diagramTitle = title;
  }

  getDiagramTitle() {
    return this.diagramTitle;
  }

  setAccTitle(title: string) {
    this.accTitle = title;
  }

  getAccTitle() {
    return this.accTitle;
  }

  setAccDescription(description: string) {
    this.accDescription = description;
  }

  getAccDescription() {
    return this.accDescription;
  }

  addIconDefinition(target: string, icon: string) {
    this.iconDefinitions.set(target, icon);
  }

  getIcon(target: string): string | undefined {
    return this.iconDefinitions.get(target);
  }

  addGroup(id: string, title?: string, parentId?: string) {
    const existing = this.groups.get(id);
    if (existing) {
      if (title && existing.title && existing.title !== title) {
        log.warn(
          `[DomainStorytelling] Conflicting group title for '${id}'. Keeping '${existing.title}' and ignoring '${title}'.`
        );
      }
      this.groups.set(id, {
        id,
        title: existing.title ?? title,
        parentId: existing.parentId ?? parentId,
      });
      return;
    }
    this.groups.set(id, { id, title, parentId });
  }

  setActorGroup(actorId: string, groupId: string) {
    const actor = this.actorsById.get(actorId);
    if (actor) {
      actor.group = groupId;
    } else {
      // Actor isn't added yet; addActor consumes this pending assignment.
      this.pendingGroupMemberships.set(actorId, groupId);
    }
  }

  setWorkobjectGroup(workobjectId: string, groupId: string) {
    const workobject = this.workobjectsById.get(workobjectId);
    if (workobject) {
      workobject.group = groupId;
    } else {
      // Workobject isn't added yet; addWorkobject consumes this pending assignment.
      this.pendingGroupMemberships.set(workobjectId, groupId);
    }
  }

  getGroups(): DomainStorytellingGroup[] {
    return [...this.groups.values()];
  }

  hasActor(id: string): boolean {
    return this.actorsById.has(id);
  }

  hasWorkobject(id: string): boolean {
    return this.workobjectsById.has(id);
  }

  hasGroup(id: string): boolean {
    return this.groups.has(id);
  }

  setActorComment(id: string, comment: string) {
    this.actorComments.set(id, comment);
  }

  setWorkobjectComment(id: string, comment: string) {
    this.workobjectComments.set(id, comment);
  }

  setGroupComment(id: string, comment: string) {
    this.groupComments.set(id, comment);
  }

  setSentenceComment(sentenceRef: string, comment: string) {
    this.sentenceComments.set(sentenceRef, comment);
  }

  getActorComment(id: string): string | undefined {
    return this.actorComments.get(id);
  }

  getWorkobjectComment(id: string): string | undefined {
    return this.workobjectComments.get(id);
  }

  getGroupComment(id: string): string | undefined {
    return this.groupComments.get(id);
  }

  getSentenceComment(sentenceRef: string): string | undefined {
    return this.sentenceComments.get(sentenceRef);
  }

  setSentenceTarget(sentenceRef: string, targetId: string) {
    this.sentenceTargets.set(sentenceRef, targetId);
  }

  getSentenceTarget(sentenceRef: string): string | undefined {
    return this.sentenceTargets.get(sentenceRef);
  }

  addActor(id: string, label?: string) {
    const fallbackLabel = stripDomainPrefix(id);
    const existingActor = this.actorsById.get(id);
    if (existingActor) {
      // Merge labels for repeated declarations/usages while keeping the first explicit label stable.
      if (!existingActor.label || existingActor.label === fallbackLabel) {
        existingActor.label = label ?? fallbackLabel;
      } else if (label && label !== fallbackLabel && existingActor.label !== label) {
        log.warn(
          `[DomainStorytelling] Conflicting actor label for '${id}'. Keeping '${existingActor.label}' and ignoring '${label}'.`
        );
      }
      return;
    }
    const icon = this.getIcon(id);
    const group = this.pendingGroupMemberships.get(id);
    this.pendingGroupMemberships.delete(id);
    const actor: DomainStorytellingActor = { id, label: label ?? fallbackLabel, icon, group };
    this.actors.push(actor);
    this.actorsById.set(id, actor);
  }

  addWorkobject(id: string, label?: string, iconTarget?: string) {
    // `id` is the per-sentence instance id (e.g. W_Ticket-S_Report); derive the
    // fallback label from the base name (iconTarget) so it reads "Ticket".
    const fallbackLabel = stripDomainPrefix(iconTarget ?? id);
    const existingWorkobject = this.workobjectsById.get(id);
    if (existingWorkobject) {
      if (!existingWorkobject.label || existingWorkobject.label === fallbackLabel) {
        existingWorkobject.label = label ?? fallbackLabel;
      } else if (label && label !== fallbackLabel && existingWorkobject.label !== label) {
        log.warn(
          `[DomainStorytelling] Conflicting workobject label for '${id}'. Keeping '${existingWorkobject.label}' and ignoring '${label}'.`
        );
      }
      return;
    }
    const resolvedLabel = label ?? fallbackLabel;
    const icon = iconTarget ? this.getIcon(iconTarget) : undefined;
    const group = this.pendingGroupMemberships.get(id);
    this.pendingGroupMemberships.delete(id);
    const workobject: DomainStorytellingWorkobject = { id, label: resolvedLabel, icon, group };
    this.workobjects.push(workobject);
    this.workobjectsById.set(id, workobject);
  }

  /**
   * Clears `group` in place on actors and workobjects that name an undeclared
   * group, warning once per dropped reference. Run after all declarations and
   * sentences are processed.
   */
  pruneUnknownGroupReferences() {
    this.actors.forEach((actor) => {
      if (actor.group && !this.groups.has(actor.group)) {
        log.warn(
          `[DomainStorytelling] Unknown group '${actor.group}' for actor '${actor.id}'. Group assignment ignored.`
        );
        actor.group = undefined;
      }
    });

    this.workobjects.forEach((workobject) => {
      if (workobject.group && !this.groups.has(workobject.group)) {
        log.warn(
          `[DomainStorytelling] Unknown group '${workobject.group}' for workobject '${workobject.id}'. Group assignment ignored.`
        );
        workobject.group = undefined;
      }
    });
  }

  addEdge(from: string, to: string, label: string, noOfSeq?: number, sentenceRef?: string) {
    const nodeExists = (id: string) => this.actorsById.has(id) || this.workobjectsById.has(id);

    if (!nodeExists(from)) {
      throw new Error(`Edge 'from' id '${from}' does not exist in actors or workobjects.`);
    }
    if (!nodeExists(to)) {
      throw new Error(`Edge 'to' id '${to}' does not exist in actors or workobjects.`);
    }

    this.edges.push({ from, to, label, noOfSeq, sentenceRef });
  }
}
