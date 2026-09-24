import type { CstNode, IToken } from 'chevrotain';
import { bpmnParser } from './bpmn.parser.js';
import type {
  BpmnDB,
  BpmnDirection,
  EventPosition,
  EventTrigger,
  GatewayKind,
  TaskSubtype,
} from '../bpmnTypes.js';

const BaseVisitor = bpmnParser.getBaseCstVisitorConstructor();

const first = (arr: unknown): IToken | undefined =>
  Array.isArray(arr) ? (arr[0] as IToken) : undefined;

const tokenText = (tok?: IToken): string => tok?.image ?? '';

const unquote = (raw: string): string => {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const SUBTYPES: Record<string, TaskSubtype> = {
  user: 'user',
  service: 'service',
  script: 'script',
  abstract: 'abstract',
};

const slug = (value: string, index: number, prefix: string): string => {
  const base = value
    .toLowerCase()
    .replace(/[^\da-z]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base ? `__${prefix}_${base}` : `__${prefix}_${index}`;
};

/**
 * Walks the CST and populates the db. Pool/lane containment is resolved here by
 * statement order: a `pool` opens a pool scope, a `lane` opens a lane scope inside
 * the current pool, and every element declared afterwards is attached to the
 * current lane/pool until the next container statement.
 */
class BpmnVisitor extends BaseVisitor {
  private db!: BpmnDB;
  private currentPoolId?: string;
  private currentPoolLabel?: string;
  private currentLaneId?: string;
  private poolCount = 0;
  private laneCount = 0;
  private flowCount = 0;

  constructor() {
    super();
    this.validateVisitor();
  }

  public build(cst: CstNode, db: BpmnDB): void {
    this.db = db;
    this.currentPoolId = undefined;
    this.currentPoolLabel = undefined;
    this.currentLaneId = undefined;
    this.poolCount = 0;
    this.laneCount = 0;
    this.flowCount = 0;
    this.visit(cst);
  }

  document(ctx: any) {
    if (ctx.header) {
      this.visit(ctx.header);
    }
    (ctx.statement ?? []).forEach((stmt: CstNode) => this.visit(stmt));
  }

  header(ctx: any) {
    if (ctx.direction) {
      this.visit(ctx.direction);
    }
  }

  direction(ctx: any) {
    let dir: BpmnDirection = 'LR';
    if (ctx.DIR_RL) {
      dir = 'RL';
    } else if (ctx.DIR_TB) {
      dir = 'TB';
    } else if (ctx.DIR_BT) {
      dir = 'BT';
    } else {
      dir = 'LR';
    }
    this.db.setDirection(dir);
  }

  statement(ctx: any) {
    if (ctx.poolDecl) {
      this.visit(ctx.poolDecl);
    } else if (ctx.laneDecl) {
      this.visit(ctx.laneDecl);
    } else if (ctx.element) {
      this.visit(ctx.element);
    } else if (ctx.flow) {
      this.visit(ctx.flow);
    }
  }

  poolDecl(ctx: any) {
    const label = this.readNameOrId(ctx.nameOrId);
    this.poolCount += 1;
    const id = slug(label, this.poolCount, 'pool');
    this.currentPoolId = id;
    this.currentPoolLabel = label;
    this.currentLaneId = undefined;
    this.db.addPool({ id, label, order: this.poolCount, laneIds: [] });
  }

  laneDecl(ctx: any) {
    const label = this.readNameOrId(ctx.nameOrId);
    this.laneCount += 1;
    const id = slug(label, this.laneCount, 'lane');
    const line = this.lineOf(ctx.nameOrId);
    if (!this.currentPoolId) {
      // Recorded with an empty poolId; validation raises rule 8.
      this.currentLaneId = id;
      this.db.addLane({ id, label, poolId: '', order: this.laneCount });
      return;
    }
    this.currentLaneId = id;
    this.db.addLane({ id, label, poolId: this.currentPoolId, order: this.laneCount });
    void line;
  }

  private readNameOrId(nameOrId: CstNode[] | undefined): string {
    const node = first(nameOrId) as unknown as CstNode | undefined;
    if (!node) {
      return '';
    }
    const ctx: any = (node as any).children;
    if (ctx.STRING) {
      return unquote(tokenText(first(ctx.STRING)));
    }
    if (ctx.labelPhrase) {
      return this.readLabelPhrase(ctx.labelPhrase);
    }
    return '';
  }

  element(ctx: any) {
    if (ctx.eventDecl) {
      this.visit(ctx.eventDecl);
    } else if (ctx.taskDecl) {
      this.visit(ctx.taskDecl);
    } else if (ctx.gatewayDecl) {
      this.visit(ctx.gatewayDecl);
    } else if (ctx.dataDecl) {
      this.visit(ctx.dataDecl);
    }
  }

  eventDecl(ctx: any) {
    let position: EventPosition = 'start';
    let keyToken: IToken | undefined;
    if (ctx.START) {
      position = 'start';
      keyToken = first(ctx.START);
    } else if (ctx.INTERMEDIATE) {
      position = 'intermediate';
      keyToken = first(ctx.INTERMEDIATE);
    } else if (ctx.END) {
      position = 'end';
      keyToken = first(ctx.END);
    }
    let trigger: EventTrigger = 'none';
    if (ctx.MESSAGE) {
      trigger = 'message';
    } else if (ctx.TIMER) {
      trigger = 'timer';
    }
    const idTok = first(ctx.IDENTIFIER);
    this.db.addNode({
      kind: 'event',
      id: tokenText(idTok),
      label: this.readLabel(ctx.label),
      position,
      trigger,
      laneId: this.currentLaneId,
      poolId: this.currentPoolId,
      line: idTok?.startLine ?? keyToken?.startLine ?? 0,
    });
  }

  taskDecl(ctx: any) {
    let subtype: TaskSubtype = 'abstract';
    if (ctx.USER_TASK) {
      subtype = 'user';
    } else if (ctx.SERVICE_TASK) {
      subtype = 'service';
    } else if (ctx.SCRIPT_TASK) {
      subtype = 'script';
    } else if (ctx.subtype) {
      const raw = tokenText(first(ctx.subtype)).toLowerCase();
      subtype = SUBTYPES[raw] ?? 'abstract';
    }
    const idTok = first(ctx.id);
    this.db.addNode({
      kind: 'task',
      id: tokenText(idTok),
      label: this.readLabel(ctx.label),
      subtype,
      laneId: this.currentLaneId,
      poolId: this.currentPoolId,
      line: idTok?.startLine ?? 0,
    });
  }

  gatewayDecl(ctx: any) {
    let gateway: GatewayKind = 'exclusive';
    if (ctx.AND) {
      gateway = 'parallel';
    } else if (ctx.OR) {
      gateway = 'inclusive';
    } else if (ctx.EVENT) {
      gateway = 'event';
    } else {
      gateway = 'exclusive';
    }
    const idTok = first(ctx.IDENTIFIER);
    this.db.addNode({
      kind: 'gateway',
      id: tokenText(idTok),
      label: this.readLabel(ctx.label),
      gateway,
      laneId: this.currentLaneId,
      poolId: this.currentPoolId,
      line: idTok?.startLine ?? 0,
    });
  }

  // These rules are read directly by their parents (readNameOrId/readLabel/etc.),
  // so the visitor only needs to declare them for `validateVisitor`.
  nameOrId() {
    /* handled by readNameOrId */
  }
  connector() {
    /* handled by readConnector */
  }
  label() {
    /* handled by readLabel */
  }
  flowLabel() {
    /* handled by readFlowLabel */
  }
  labelPhrase() {
    /* handled by readLabelPhrase */
  }

  dataDecl(ctx: any) {
    const idTok = first(ctx.IDENTIFIER);
    this.db.addNode({
      kind: 'data',
      id: tokenText(idTok),
      label: this.readLabel(ctx.label),
      laneId: this.currentLaneId,
      poolId: this.currentPoolId,
      line: idTok?.startLine ?? 0,
    });
  }

  flow(ctx: any) {
    const ids: IToken[] = [...(ctx.IDENTIFIER ?? []), ...(ctx.target ?? [])].sort(
      (a, b) => (a.startOffset ?? 0) - (b.startOffset ?? 0)
    );
    const connectors: CstNode[] = ctx.connector ?? [];
    for (const [i, connector] of connectors.entries()) {
      const sourceTok = ids[i];
      const targetTok = ids[i + 1];
      if (!sourceTok || !targetTok) {
        continue;
      }
      const conn = this.readConnector(connector);
      this.flowCount += 1;
      const rawLabel = conn.label;
      const isDefault = rawLabel !== undefined && rawLabel.trim().toLowerCase() === 'default';
      this.db.addFlow({
        id: `__flow_${this.flowCount}`,
        sourceId: tokenText(sourceTok),
        targetId: tokenText(targetTok),
        kind: conn.kind,
        label: isDefault ? undefined : rawLabel,
        isDefault: isDefault || undefined,
        line: sourceTok.startLine ?? 0,
      });
    }
  }

  private readConnector(node: CstNode): {
    kind: 'sequence' | 'message' | 'association';
    label?: string;
  } {
    const ctx: any = (node as any).children;
    let label: string | undefined;
    if (ctx.flowLabel) {
      label = this.readFlowLabel(ctx.flowLabel);
    }
    if (ctx.MSG_ARROW) {
      return { kind: 'message', label };
    }
    if (ctx.ASSOCIATION) {
      return { kind: 'association', label };
    }
    return { kind: 'sequence', label };
  }

  private readFlowLabel(flowLabel: CstNode[]): string | undefined {
    const node = first(flowLabel) as unknown as CstNode | undefined;
    if (!node) {
      return undefined;
    }
    const ctx: any = (node as any).children;
    if (ctx.STRING) {
      return unquote(tokenText(first(ctx.STRING)));
    }
    if (ctx.labelPhrase) {
      return this.readLabelPhrase(ctx.labelPhrase);
    }
    return undefined;
  }

  private readLabel(label: CstNode[] | undefined): string | undefined {
    if (!label) {
      return undefined;
    }
    const node = first(label) as unknown as CstNode | undefined;
    if (!node) {
      return undefined;
    }
    const ctx: any = (node as any).children;
    if (ctx.STRING) {
      return unquote(tokenText(first(ctx.STRING)));
    }
    if (ctx.labelPhrase) {
      return this.readLabelPhrase(ctx.labelPhrase);
    }
    return undefined;
  }

  private readLabelPhrase(labelPhrase: CstNode[]): string {
    const node = first(labelPhrase) as unknown as CstNode | undefined;
    if (!node) {
      return '';
    }
    const ctx: any = (node as any).children;
    const words: IToken[] = [];
    for (const key of Object.keys(ctx)) {
      for (const tok of ctx[key]) {
        words.push(tok as IToken);
      }
    }
    words.sort((a, b) => (a.startOffset ?? 0) - (b.startOffset ?? 0));
    return words.map((tok) => tok.image).join(' ');
  }

  private lineOf(nameOrId: CstNode[] | undefined): number {
    const node = first(nameOrId) as unknown as CstNode | undefined;
    if (!node) {
      return 0;
    }
    const ctx: any = (node as any).children;
    for (const key of Object.keys(ctx)) {
      const tok = first(ctx[key]);
      if (tok?.startLine) {
        return tok.startLine;
      }
    }
    return 0;
  }
}

export const bpmnVisitor = new BpmnVisitor();
