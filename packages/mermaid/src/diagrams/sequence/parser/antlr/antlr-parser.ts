/**
 * ANTLR-based Sequence Diagram Parser (initial implementation)
 *
 * Mirrors the flowchart setup: provides an ANTLR entry compatible with the Jison interface.
 */

import { CharStream, CommonTokenStream, ParseTreeWalker, BailErrorStrategy } from 'antlr4ng';
import { SequenceLexer } from './generated/SequenceLexer.js';
import { SequenceParser } from './generated/SequenceParser.js';

class ANTLRSequenceParser {
  yy: any = null;

  private mapSignalType(op: string): number | undefined {
    const LT = this.yy?.LINETYPE;
    if (!LT) {
      return undefined;
    }
    switch (op) {
      case '->':
        return LT.SOLID_OPEN;
      case '-->':
        return LT.DOTTED_OPEN;
      case '->>':
        return LT.SOLID;
      case '-->>':
        return LT.DOTTED;
      case '<<->>':
        return LT.BIDIRECTIONAL_SOLID;
      case '<<-->>':
        return LT.BIDIRECTIONAL_DOTTED;
      case '-x':
        return LT.SOLID_CROSS;
      case '--x':
        return LT.DOTTED_CROSS;
      case '-)':
        return LT.SOLID_POINT;
      case '--)':
        return LT.DOTTED_POINT;
      default:
        return undefined;
    }
  }

  parse(input: string): any {
    if (!this.yy) {
      throw new Error('Sequence ANTLR parser missing yy (database).');
    }

    // Reset DB to match Jison behavior
    this.yy.clear();

    const inputStream = CharStream.fromString(input);
    const lexer = new SequenceLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new SequenceParser(tokenStream);

    // Fail-fast on any syntax error (matches Jison throwing behavior)
    const anyParser = parser as unknown as {
      getErrorHandler?: () => unknown;
      setErrorHandler?: (h: unknown) => void;
      errorHandler?: unknown;
    };
    const currentHandler = anyParser.getErrorHandler?.() ?? anyParser.errorHandler;
    if (!currentHandler || (currentHandler as any)?.constructor?.name !== 'BailErrorStrategy') {
      if (typeof anyParser.setErrorHandler === 'function') {
        anyParser.setErrorHandler(new BailErrorStrategy());
      } else {
        (parser as any).errorHandler = new BailErrorStrategy();
      }
    }

    const tree = parser.start();

    const db = this.yy;

    // Minimal listener for participants and simple messages
    const listener: any = {
      // Required hooks for ParseTreeWalker
      visitTerminal(_node?: unknown) {
        void _node;
      },
      visitErrorNode(_node?: unknown) {
        void _node;
      },
      enterEveryRule(_ctx?: unknown) {
        void _ctx;
      },
      exitEveryRule(_ctx?: unknown) {
        void _ctx;
      },

      // loop block: add start on enter, end on exit to wrap inner content
      enterLoopBlock(ctx: any) {
        try {
          const rest = ctx.restOfLine?.();
          const raw = rest ? (rest.getText?.() as string | undefined) : undefined;
          const msgText =
            raw !== undefined ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.LOOP_START);
        } catch {}
      },
      exitLoopBlock() {
        try {
          db.addSignal(undefined, undefined, undefined, db.LINETYPE.LOOP_END);
        } catch {}
      },

      exitParticipantStatement(ctx: any) {
        // Extended participant syntax: participant <ACTOR>@{...}
        const awc = ctx.actorWithConfig?.();
        if (awc) {
          const awcCtx = Array.isArray(awc) ? awc[0] : awc;
          const idTok = awcCtx?.ACTOR?.();
          const id = (Array.isArray(idTok) ? idTok[0] : idTok)?.getText?.() as string | undefined;
          if (!id) {
            return;
          }
          const cfgObj = awcCtx?.configObject?.();
          const cfgCtx = Array.isArray(cfgObj) ? cfgObj[0] : cfgObj;
          const cfgTok = cfgCtx?.CONFIG_CONTENT?.();
          const metadata = (Array.isArray(cfgTok) ? cfgTok[0] : cfgTok)?.getText?.() as
            | string
            | undefined;
          // Important: let errors from YAML parsing propagate for invalid configs
          db.addActor(id, id, { text: id, type: 'participant' }, 'participant', metadata);
          return;
        }

        try {
          const hasActor = !!ctx.PARTICIPANT_ACTOR?.();
          const draw = hasActor ? 'actor' : 'participant';

          const id = ctx.actor?.(0)?.getText?.() as string | undefined;
          if (!id) {
            return;
          }

          let display = id;
          if (ctx.AS) {
            let raw: string | undefined;
            const rest = ctx.restOfLine?.();
            raw = rest?.getText?.() as string | undefined;
            if (raw === undefined && ctx.TXT) {
              const t = ctx.TXT();
              raw = Array.isArray(t)
                ? (t[0]?.getText?.() as string | undefined)
                : (t?.getText?.() as string | undefined);
            }
            if (raw !== undefined) {
              const trimmed = raw.startsWith(':') ? raw.slice(1) : raw;
              const v = trimmed.trim();
              if (v) {
                display = v;
              }
            }
          }

          const desc = { text: display, type: draw };
          db.addActor(id, id, desc, draw);
        } catch (_e) {
          // swallow to keep parity with Jison robustness
        }
      },

      exitCreateStatement(ctx: any) {
        try {
          const hasActor = !!ctx.PARTICIPANT_ACTOR?.();
          const draw = hasActor ? 'actor' : 'participant';
          const id = ctx.actor?.()?.getText?.() as string | undefined;
          if (!id) {
            return;
          }

          let display = id;
          if (ctx.AS) {
            let raw: string | undefined;
            const rest = ctx.restOfLine?.();
            raw = rest?.getText?.() as string | undefined;
            if (raw === undefined && ctx.TXT) {
              const t = ctx.TXT();
              raw = Array.isArray(t)
                ? (t[0]?.getText?.() as string | undefined)
                : (t?.getText?.() as string | undefined);
            }
            if (raw !== undefined) {
              const trimmed = raw.startsWith(':') ? raw.slice(1) : raw;
              const v = trimmed.trim();
              if (v) {
                display = v;
              }
            }
          }

          db.addActor(id, id, { text: display, type: draw }, draw);
          const msgs = db.getMessages?.() ?? [];
          db.getCreatedActors?.().set(id, msgs.length);
        } catch (_e) {
          // ignore to keep resilience
        }
      },

      exitDestroyStatement(ctx: any) {
        try {
          const id = ctx.actor?.()?.getText?.() as string | undefined;
          if (!id) {
            return;
          }
          const msgs = db.getMessages?.() ?? [];
          db.getDestroyedActors?.().set(id, msgs.length);
        } catch (_e) {
          // ignore to keep resilience
        }
      },

      // opt block
      enterOptBlock(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.OPT_START);
        } catch {}
      },
      exitOptBlock() {
        try {
          db.addSignal(undefined, undefined, undefined, db.LINETYPE.OPT_END);
        } catch {}
      },

      // alt block
      enterAltBlock(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.ALT_START);
        } catch {}
      },
      exitAltBlock() {
        try {
          db.addSignal(undefined, undefined, undefined, db.LINETYPE.ALT_END);
        } catch {}
      },
      enterElseSection(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.ALT_ELSE);
        } catch {}
      },

      // par and par_over blocks
      enterParBlock(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.PAR_START);
        } catch {}
      },
      enterParOverBlock(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.PAR_OVER_START);
        } catch {}
      },
      exitParBlock() {
        try {
          db.addSignal(undefined, undefined, undefined, db.LINETYPE.PAR_END);
        } catch {}
      },
      exitParOverBlock() {
        try {
          db.addSignal(undefined, undefined, undefined, db.LINETYPE.PAR_END);
        } catch {}
      },
      enterAndSection(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.PAR_AND);
        } catch {}
      },

      // critical block
      enterCriticalBlock(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.CRITICAL_START);
        } catch {}
      },
      exitCriticalBlock() {
        try {
          db.addSignal(undefined, undefined, undefined, db.LINETYPE.CRITICAL_END);
        } catch {}
      },
      enterOptionSection(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.CRITICAL_OPTION);
        } catch {}
      },

      // break block
      enterBreakBlock(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.BREAK_START);
        } catch {}
      },
      exitBreakBlock() {
        try {
          db.addSignal(undefined, undefined, undefined, db.LINETYPE.BREAK_END);
        } catch {}
      },

      // rect block
      enterRectBlock(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
          const msg = msgText !== undefined ? db.parseMessage(msgText) : undefined;
          db.addSignal(undefined, undefined, msg, db.LINETYPE.RECT_START);
        } catch {}
      },
      exitRectBlock() {
        try {
          db.addSignal(undefined, undefined, undefined, db.LINETYPE.RECT_END);
        } catch {}
      },

      // box block
      enterBoxBlock(ctx: any) {
        try {
          const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
          // raw may come from LINE_TXT (no leading colon) or TXT (leading colon)
          const line = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : '';
          const data = db.parseBoxData(line);
          db.addBox(data);
        } catch {}
      },
      exitBoxBlock() {
        try {
          // boxEnd is private in TS types; cast to any to call it here like Jison does via apply()
          db.boxEnd();
        } catch {}
      },

      exitSignalStatement(ctx: any) {
        const a1Raw = ctx.actor(0)?.getText?.() as string | undefined;
        const a2 = ctx.actor(1)?.getText?.();
        const st = ctx.signaltype?.();
        const stTextRaw = st ? st.getText() : '';

        // Workaround for current lexer attaching '-' to the left actor (e.g., 'Alice-' + '>>')
        let a1 = a1Raw ?? '';
        let op = stTextRaw;
        if (a1 && /-+$/.test(a1)) {
          const m = /-+$/.exec(a1)![0];
          a1 = a1.slice(0, -m.length);
          op = m + op; // restore full operator, e.g., '-' + '>>' => '->>' or '--' + '>' => '-->'
        }

        const typ = listener._mapSignal(op);
        if (typ === undefined) {
          return; // Not a recognized operator; skip adding a signal
        }
        const t2 = ctx.text2?.();
        const msgTok = t2 ? t2.getText() : undefined;
        const msgText = msgTok?.startsWith(':') ? msgTok.slice(1) : undefined;
        const msg = msgText ? db.parseMessage(msgText) : undefined;

        // Ensure participants exist like Jison does
        const actorsMap = db.getActors?.();
        const ensure = (id?: string) => {
          if (!id) {
            return;
          }
          if (!actorsMap?.has(id)) {
            db.addActor(id, id, { text: id, type: 'participant' }, 'participant');
          }
        };
        ensure(a1);
        ensure(a2);

        const hasPlus = !!ctx.PLUS?.();
        const hasMinus = !!ctx.MINUS?.();

        // Main signal; pass 'activate' flag if there is a plus before the target actor
        db.addSignal(a1, a2, msg, typ, hasPlus);

        // One-line activation/deactivation side-effects
        if (hasPlus && a2) {
          db.addSignal(a2, undefined, undefined, db.LINETYPE.ACTIVE_START);
        }
        if (hasMinus && a1) {
          db.addSignal(a1, undefined, undefined, db.LINETYPE.ACTIVE_END);
        }
      },
      exitNoteStatement(ctx: any) {
        try {
          const t2 = ctx.text2?.();
          const msgTok = t2 ? t2.getText() : undefined;
          const msgText = msgTok?.startsWith(':') ? msgTok.slice(1) : undefined;
          const text = msgText ? db.parseMessage(msgText) : { text: '' };

          // Determine placement and actors
          let placement = db.PLACEMENT.RIGHTOF;

          // Collect all actor texts using index-based accessor to be robust across runtimes
          const actorIds: string[] = [];
          if (typeof ctx.actor === 'function') {
            let i = 0;
            // @ts-ignore - antlr4ng contexts allow indexed accessors
            while (true) {
              const node = ctx.actor(i);
              if (!node || typeof node.getText !== 'function') {
                break;
              }
              actorIds.push(node.getText());
              i++;
            }
            // Fallback to single access when no indexed nodes are exposed
            if (actorIds.length === 0) {
              // @ts-ignore - antlr4ng exposes single-argument accessor in some builds
              const single = ctx.actor();
              const txt =
                single && typeof single.getText === 'function' ? single.getText() : undefined;
              if (txt) {
                actorIds.push(txt);
              }
            }
          }

          if (ctx.RIGHT_OF?.()) {
            placement = db.PLACEMENT.RIGHTOF;
            // keep first actor only
            if (actorIds.length > 1) {
              actorIds.splice(1);
            }
          } else if (ctx.LEFT_OF?.()) {
            placement = db.PLACEMENT.LEFTOF;
            if (actorIds.length > 1) {
              actorIds.splice(1);
            }
          } else {
            placement = db.PLACEMENT.OVER;
            // keep one or two actors as collected
            if (actorIds.length > 2) {
              actorIds.splice(2);
            }
          }

          // Ensure actors exist
          const actorsMap = db.getActors?.();
          for (const id of actorIds) {
            if (id && !actorsMap?.has(id)) {
              db.addActor(id, id, { text: id, type: 'participant' }, 'participant');
            }
          }

          const actorParam: any = actorIds.length > 1 ? actorIds : actorIds[0];
          db.addNote(actorParam, placement, {
            text: text.text,
            wrap: text.wrap,
          });
        } catch (_e) {
          // ignore
        }
      },
      exitLinksStatement(ctx: any) {
        try {
          const a = ctx.actor?.()?.getText?.() as string | undefined;
          const t2 = ctx.text2?.();
          const msgTok = t2 ? t2.getText() : undefined;
          const msgText = msgTok?.startsWith(':') ? msgTok.slice(1) : undefined;
          const text = msgText ? db.parseMessage(msgText) : { text: '' };
          if (!a) {
            return;
          }
          const actorsMap = db.getActors?.();
          if (!actorsMap?.has(a)) {
            db.addActor(a, a, { text: a, type: 'participant' }, 'participant');
          }
          db.addLinks(a, text);
        } catch {}
      },
      exitLinkStatement(ctx: any) {
        try {
          const a = ctx.actor?.()?.getText?.() as string | undefined;
          const t2 = ctx.text2?.();
          const msgTok = t2 ? t2.getText() : undefined;
          const msgText = msgTok?.startsWith(':') ? msgTok.slice(1) : undefined;
          const text = msgText ? db.parseMessage(msgText) : { text: '' };
          if (!a) {
            return;
          }
          const actorsMap = db.getActors?.();
          if (!actorsMap?.has(a)) {
            db.addActor(a, a, { text: a, type: 'participant' }, 'participant');
          }
          db.addALink(a, text);
        } catch {}
      },
      exitPropertiesStatement(ctx: any) {
        try {
          const a = ctx.actor?.()?.getText?.() as string | undefined;
          const t2 = ctx.text2?.();
          const msgTok = t2 ? t2.getText() : undefined;
          const msgText = msgTok?.startsWith(':') ? msgTok.slice(1) : undefined;
          const text = msgText ? db.parseMessage(msgText) : { text: '' };
          if (!a) {
            return;
          }
          const actorsMap = db.getActors?.();
          if (!actorsMap?.has(a)) {
            db.addActor(a, a, { text: a, type: 'participant' }, 'participant');
          }
          db.addProperties(a, text);
        } catch {}
      },
      exitDetailsStatement(ctx: any) {
        try {
          const a = ctx.actor?.()?.getText?.() as string | undefined;
          const t2 = ctx.text2?.();
          const msgTok = t2 ? t2.getText() : undefined;
          const msgText = msgTok?.startsWith(':') ? msgTok.slice(1) : undefined;
          const text = msgText ? db.parseMessage(msgText) : { text: '' };
          if (!a) {
            return;
          }
          const actorsMap = db.getActors?.();
          if (!actorsMap?.has(a)) {
            db.addActor(a, a, { text: a, type: 'participant' }, 'participant');
          }
          db.addDetails(a, text);
        } catch {}
      },
      exitActivationStatement(ctx: any) {
        const a = ctx.actor?.()?.getText?.();
        if (!a) {
          return;
        }
        const actorsMap = db.getActors?.();
        if (!actorsMap?.has(a)) {
          db.addActor(a, a, { text: a, type: 'participant' }, 'participant');
        }
        const typ = ctx.ACTIVATE?.() ? db.LINETYPE.ACTIVE_START : db.LINETYPE.ACTIVE_END;
        db.addSignal(a, a, { text: '', wrap: false }, typ);
      },
      exitAutonumberStatement(ctx: any) {
        // Parse variants: autonumber | autonumber off | autonumber <start> | autonumber <start> <step>
        const isOff = !!(ctx.OFF && typeof ctx.OFF === 'function' && ctx.OFF());
        const tokens = ctx.ACTOR && typeof ctx.ACTOR === 'function' ? ctx.ACTOR() : undefined;
        const parts: string[] = Array.isArray(tokens)
          ? tokens
              .map((t: any) => (typeof t.getText === 'function' ? t.getText() : undefined))
              .filter(Boolean)
          : tokens && typeof tokens.getText === 'function'
            ? [tokens.getText()]
            : [];

        let start: number | undefined;
        let step: number | undefined;
        if (parts.length >= 1) {
          const v = Number.parseInt(parts[0], 10);
          if (!Number.isNaN(v)) {
            start = v;
          }
        }
        if (parts.length >= 2) {
          const v = Number.parseInt(parts[1], 10);
          if (!Number.isNaN(v)) {
            step = v;
          }
        }

        const visible = !isOff;
        if (visible) {
          db.enableSequenceNumbers();
        } else {
          db.disableSequenceNumbers();
        }

        // Match Jison behavior: if only start is provided, default step to 1
        const payload = {
          type: 'sequenceIndex' as const,
          sequenceIndex: start,
          sequenceIndexStep: step ?? (start !== undefined ? 1 : undefined),
          sequenceVisible: visible,
          signalType: db.LINETYPE.AUTONUMBER,
        };

        db.apply(payload);
      },
      exitTitleStatement(ctx: any) {
        try {
          let titleText: string | undefined;

          // Case 1: If TITLE token carried inline text (legacy path), use it; otherwise fall through
          if (ctx.TITLE) {
            const tok = ctx.TITLE()?.getText?.() as string | undefined;
            if (tok && tok.length > 'title'.length) {
              const after = tok.slice('title'.length).trim();
              if (after) {
                titleText = after;
              }
            }
          }

          // Case 2: "title:" used restOfLine (TXT) token
          if (titleText === undefined) {
            const rest = ctx.restOfLine?.().getText?.() as string | undefined;
            if (rest !== undefined) {
              const raw = rest.startsWith(':') ? rest.slice(1) : rest;
              titleText = raw.trim();
            }
          }

          // Case 3: title without colon tokenized as ACTOR(s)
          if (titleText === undefined) {
            if (ctx.actor) {
              const nodes = ctx.actor();
              const parts = Array.isArray(nodes)
                ? nodes.map((a: any) => a.getText())
                : [nodes?.getText?.()].filter(Boolean);
              titleText = parts.join(' ');
            } else if (ctx.ACTOR) {
              const tokens = ctx.ACTOR();
              const parts = Array.isArray(tokens)
                ? tokens.map((t: any) => t.getText())
                : [tokens?.getText?.()].filter(Boolean);
              titleText = parts.join(' ');
            }
          }

          if (!titleText) {
            const parts = (ctx.children ?? [])
              .map((c: any) =>
                c?.symbol?.type === SequenceLexer.ACTOR ? c.getText?.() : undefined
              )
              .filter(Boolean) as string[];
            if (parts.length) {
              titleText = parts.join(' ');
            }
          }

          if (titleText) {
            db.setDiagramTitle?.(titleText);
          }
        } catch {}
      },
      exitLegacyTitleStatement(ctx: any) {
        try {
          const tok = ctx.LEGACY_TITLE?.().getText?.() as string | undefined;
          if (!tok) {
            return;
          }
          const idx = tok.indexOf(':');
          const titleText = (idx >= 0 ? tok.slice(idx + 1) : tok).trim();
          if (titleText) {
            db.setDiagramTitle?.(titleText);
          }
        } catch {}
      },
      exitAccTitleStatement(ctx: any) {
        try {
          const v = ctx.ACC_TITLE_VALUE?.().getText?.() as string | undefined;
          if (v !== undefined) {
            const val = v.trim();
            if (val) {
              db.setAccTitle?.(val);
            }
          }
        } catch {}
      },
      exitAccDescrStatement(ctx: any) {
        try {
          const v = ctx.ACC_DESCR_VALUE?.().getText?.() as string | undefined;
          if (v !== undefined) {
            const val = v.trim();
            if (val) {
              db.setAccDescription?.(val);
            }
          }
        } catch {}
      },
      exitAccDescrMultilineStatement(ctx: any) {
        try {
          const v = ctx.ACC_DESCR_MULTILINE_VALUE?.().getText?.() as string | undefined;
          if (v !== undefined) {
            const val = v.trim();
            if (val) {
              db.setAccDescription?.(val);
            }
          }
        } catch {}
      },

      _mapSignal: (op: string) => this.mapSignalType(op),
    };

    ParseTreeWalker.DEFAULT.walk(listener, tree);
    return tree;
  }
}

// Export in the format expected by the existing code
const parser = new ANTLRSequenceParser();

const exportedParser = {
  parse: (input: string) => parser.parse(input),
  parser: parser,
  yy: null as any,
};

Object.defineProperty(exportedParser, 'yy', {
  get() {
    return parser.yy;
  },
  set(value) {
    parser.yy = value;
  },
});

export default exportedParser;
