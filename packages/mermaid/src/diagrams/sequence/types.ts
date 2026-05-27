/**
 * Represents a box in a nested sequence diagram structure.
 *
 * A box may contain actors and child boxes, allowing recursive
 * nesting of box structures (outer and inner scopes).
 */
export interface Box {
  name?: string;
  fill?: string;
  wrap?: boolean;
  actorKeys: string[];
  children: Box[];
  parent?: Box;
}

export interface Actor {
  box?: Box;
  name: string;
  description: string;
  wrap: boolean;
  prevActor?: string;
  nextActor?: string;
  links: Record<string, unknown>;
  properties: Record<string, unknown>;
  actorCnt: number | null;
  rectData: unknown;
  type: string;
}

export interface Message {
  id: string;
  from?: string;
  to?: string;
  message:
    | string
    | {
        start: number;
        step: number;
        visible: boolean;
      };
  wrap: boolean;
  answer?: unknown;
  type?: number;
  activate?: boolean;
  placement?: string;
  centralConnection?: number;
}

export interface AddMessageParams {
  from: string;
  to: string;
  msg: string;
  signalType: number;
  type:
    | 'addMessage'
    | 'sequenceIndex'
    | 'addParticipant'
    | 'createParticipant'
    | 'destroyParticipant'
    | 'activeStart'
    | 'activeEnd'
    | 'centralConnection'
    | 'centralConnectionReverse'
    | 'addNote'
    | 'addLinks'
    | 'addALink'
    | 'addProperties'
    | 'addDetails'
    | 'boxStart'
    | 'boxEnd'
    | 'loopStart'
    | 'loopEnd'
    | 'rectStart'
    | 'rectEnd'
    | 'optStart'
    | 'optEnd'
    | 'altStart'
    | 'else'
    | 'altEnd'
    | 'setAccTitle'
    | 'parStart'
    | 'parAnd'
    | 'parEnd'
    | 'and'
    | 'criticalStart'
    | 'criticalOption'
    | 'option'
    | 'criticalEnd'
    | 'breakStart'
    | 'breakEnd'
    | 'parOverStart'
    | 'parOverEnd'
    | 'parOverAnd';

  activate: boolean;
}

export interface Note {
  actor: { actor: string };
  placement: Message['placement'];
  message: string;
  wrap: boolean;
}
