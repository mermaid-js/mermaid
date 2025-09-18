/**
 * Core shared logic for both Listener and Visitor patterns for Sequence Diagrams
 * Contains all the proven parsing logic extracted from the monolithic antlr-parser.ts
 */
export class SequenceParserCore {
  protected db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Helper method to get environment variables (same as flowchart)
  protected getEnvVar(name: string): string | undefined {
    try {
      if (typeof process !== 'undefined' && process.env) {
        return process.env[name];
      }
    } catch (_e) {
      // process is not defined in browser, continue to browser checks
    }

    // In browser, check for global variables
    if (typeof window !== 'undefined' && (window as any).MERMAID_CONFIG) {
      return (window as any).MERMAID_CONFIG[name];
    }
    return undefined;
  }

  // Signal type mapping helper
  protected mapSignalType(op: string): number | undefined {
    const LT = this.db?.LINETYPE;
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

  // Loop block processing
  protected processLoopBlockEnter(ctx: any): void {
    try {
      const rest = ctx.restOfLine?.();
      const raw = rest ? (rest.getText?.() as string | undefined) : undefined;
      const msgText =
        raw !== undefined ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
      const msg = msgText !== undefined ? this.db.parseMessage(msgText) : undefined;
      this.db.addSignal(undefined, undefined, msg, this.db.LINETYPE.LOOP_START);
    } catch {}
  }

  protected processLoopBlockExit(): void {
    try {
      this.db.addSignal(undefined, undefined, undefined, this.db.LINETYPE.LOOP_END);
    } catch {}
  }

  // Participant statement processing
  protected processParticipantStatement(ctx: any): void {
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
      this.db.addActor(id, id, { text: id, type: 'participant' }, 'participant', metadata);
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
      this.db.addActor(id, id, desc, draw);
    } catch (_e) {
      // swallow to keep parity with Jison robustness
    }
  }

  // Create statement processing
  protected processCreateStatement(ctx: any): void {
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

      this.db.addActor(id, id, { text: display, type: draw }, draw);
      const msgs = this.db.getMessages?.() ?? [];
      this.db.getCreatedActors?.().set(id, msgs.length);
    } catch (_e) {
      // ignore to keep resilience
    }
  }

  // Destroy statement processing
  protected processDestroyStatement(ctx: any): void {
    try {
      const id = ctx.actor?.()?.getText?.() as string | undefined;
      if (!id) {
        return;
      }
      const msgs = this.db.getMessages?.() ?? [];
      this.db.getDestroyedActors?.().set(id, msgs.length);
    } catch (_e) {
      // ignore to keep resilience
    }
  }

  // Opt block processing
  protected processOptBlockEnter(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
      const msg = msgText !== undefined ? this.db.parseMessage(msgText) : undefined;
      this.db.addSignal(undefined, undefined, msg, this.db.LINETYPE.OPT_START);
    } catch {}
  }

  protected processOptBlockExit(): void {
    try {
      this.db.addSignal(undefined, undefined, undefined, this.db.LINETYPE.OPT_END);
    } catch {}
  }

  // Alt block processing
  protected processAltBlockEnter(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
      const msg = msgText !== undefined ? this.db.parseMessage(msgText) : undefined;
      this.db.addSignal(undefined, undefined, msg, this.db.LINETYPE.ALT_START);
    } catch {}
  }

  protected processAltBlockExit(): void {
    try {
      this.db.addSignal(undefined, undefined, undefined, this.db.LINETYPE.ALT_END);
    } catch {}
  }

  protected processElseSection(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
      const msg = msgText !== undefined ? this.db.parseMessage(msgText) : undefined;
      this.db.addSignal(undefined, undefined, msg, this.db.LINETYPE.ALT_ELSE);
    } catch {}
  }

  // Par block processing
  protected processParBlockEnter(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
      const msg = msgText !== undefined ? this.db.parseMessage(msgText) : undefined;
      this.db.addSignal(undefined, undefined, msg, this.db.LINETYPE.PAR_START);
    } catch {}
  }

  protected processParBlockExit(): void {
    try {
      this.db.addSignal(undefined, undefined, undefined, this.db.LINETYPE.PAR_END);
    } catch {}
  }

  protected processAndSection(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
      const msg = msgText !== undefined ? this.db.parseMessage(msgText) : undefined;
      this.db.addSignal(undefined, undefined, msg, this.db.LINETYPE.PAR_AND);
    } catch {}
  }

  // ParOver block processing
  protected processParOverBlockEnter(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
      const msg = msgText !== undefined ? this.db.parseMessage(msgText) : undefined;
      this.db.addSignal(undefined, undefined, msg, this.db.LINETYPE.PAR_OVER_START);
    } catch {}
  }

  protected processParOverBlockExit(): void {
    try {
      this.db.addSignal(undefined, undefined, undefined, this.db.LINETYPE.PAR_OVER_END);
    } catch {}
  }

  // Rect block processing
  protected processRectBlockEnter(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const line = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : '';
      const data = this.db.parseBoxData(line);
      this.db.addBox(data);
    } catch {}
  }

  protected processRectBlockExit(): void {
    try {
      this.db.boxEnd();
    } catch {}
  }

  // Box block processing
  protected processBoxBlockEnter(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const line = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : '';
      const data = this.db.parseBoxData(line);
      this.db.addBox(data);
    } catch {}
  }

  protected processBoxBlockExit(): void {
    try {
      this.db.boxEnd();
    } catch {}
  }

  // Break block processing
  protected processBreakBlockEnter(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
      const msg = msgText !== undefined ? this.db.parseMessage(msgText) : undefined;
      this.db.addSignal(undefined, undefined, msg, this.db.LINETYPE.BREAK_START);
    } catch {}
  }

  protected processBreakBlockExit(): void {
    try {
      this.db.addSignal(undefined, undefined, undefined, this.db.LINETYPE.BREAK_END);
    } catch {}
  }

  // Critical block processing
  protected processCriticalBlockEnter(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
      const msg = msgText !== undefined ? this.db.parseMessage(msgText) : undefined;
      this.db.addSignal(undefined, undefined, msg, this.db.LINETYPE.CRITICAL_START);
    } catch {}
  }

  protected processCriticalBlockExit(): void {
    try {
      this.db.addSignal(undefined, undefined, undefined, this.db.LINETYPE.CRITICAL_END);
    } catch {}
  }

  protected processOptionSection(ctx: any): void {
    try {
      const raw = ctx.restOfLine?.()?.getText?.() as string | undefined;
      const msgText = raw ? (raw.startsWith(':') ? raw.slice(1) : raw).trim() : undefined;
      const msg = msgText !== undefined ? this.db.parseMessage(msgText) : undefined;
      this.db.addSignal(undefined, undefined, msg, this.db.LINETYPE.CRITICAL_OPTION);
    } catch {}
  }

  // Signal statement processing
  protected processSignalStatement(ctx: any): void {
    try {
      const actors = ctx.actor?.();
      if (!actors || actors.length < 2) {
        return;
      }

      const from = actors[0]?.getText?.() as string | undefined;
      const to = actors[1]?.getText?.() as string | undefined;
      if (!from || !to) {
        return;
      }

      const signalType = ctx.signaltype?.()?.getText?.() as string | undefined;
      if (!signalType) {
        return;
      }

      const msgText = ctx.text2?.()?.getText?.() as string | undefined;
      const msg = msgText ? this.db.parseMessage(msgText) : undefined;
      const lineType = this.mapSignalType(signalType);

      if (lineType !== undefined) {
        this.db.addSignal(from, to, msg, lineType);
      }
    } catch {}
  }

  // Note statement processing
  protected processNoteStatement(ctx: any): void {
    try {
      const placement = ctx.RIGHT_OF?.() ? 'rightOf' : ctx.LEFT_OF?.() ? 'leftOf' : 'over';
      const actors = ctx.actor?.();
      const actor1 = actors?.[0]?.getText?.() as string | undefined;
      const actor2 = actors?.[1]?.getText?.() as string | undefined;

      const msgText = ctx.text2?.()?.getText?.() as string | undefined;
      const msg = msgText ? this.db.parseMessage(msgText) : undefined;

      if (placement === 'over' && actor2) {
        this.db.addSignal(actor1, actor2, msg, this.db.LINETYPE.NOTE);
      } else if (actor1) {
        this.db.addSignal(actor1, undefined, msg, this.db.LINETYPE.NOTE, placement);
      }
    } catch {}
  }

  // Links statement processing
  protected processLinksStatement(ctx: any): void {
    try {
      const actor = ctx.actor?.()?.getText?.() as string | undefined;
      if (!actor) {
        return;
      }
      const msgText = ctx.text2?.()?.getText?.() as string | undefined;
      const msg = msgText ? this.db.parseMessage(msgText) : undefined;
      this.db.addLinks(actor, msg);
    } catch {}
  }

  // Link statement processing
  protected processLinkStatement(ctx: any): void {
    try {
      const actor = ctx.actor?.()?.getText?.() as string | undefined;
      if (!actor) {
        return;
      }
      const msgText = ctx.text2?.()?.getText?.() as string | undefined;
      const msg = msgText ? this.db.parseMessage(msgText) : undefined;
      this.db.addLink(actor, msg);
    } catch {}
  }

  // Properties statement processing
  protected processPropertiesStatement(ctx: any): void {
    try {
      const actor = ctx.actor?.()?.getText?.() as string | undefined;
      if (!actor) {
        return;
      }
      const msgText = ctx.text2?.()?.getText?.() as string | undefined;
      const msg = msgText ? this.db.parseMessage(msgText) : undefined;
      this.db.addProperties(actor, msg);
    } catch {}
  }

  // Details statement processing
  protected processDetailsStatement(ctx: any): void {
    try {
      const actor = ctx.actor?.()?.getText?.() as string | undefined;
      if (!actor) {
        return;
      }
      const msgText = ctx.text2?.()?.getText?.() as string | undefined;
      const msg = msgText ? this.db.parseMessage(msgText) : undefined;
      this.db.addDetails(actor, msg);
    } catch {}
  }

  // Activation statement processing
  protected processActivationStatement(ctx: any): void {
    try {
      const actor = ctx.actor?.()?.getText?.() as string | undefined;
      if (!actor) {
        return;
      }

      const isActivate = !!ctx.ACTIVATE?.();
      const isDeactivate = !!ctx.DEACTIVATE?.();

      if (isActivate) {
        this.db.addSignal(actor, undefined, undefined, this.db.LINETYPE.ACTIVE_START);
      } else if (isDeactivate) {
        this.db.addSignal(actor, undefined, undefined, this.db.LINETYPE.ACTIVE_END);
      }
    } catch {}
  }

  // Autonumber statement processing
  protected processAutonumberStatement(ctx: any): void {
    try {
      const isOff = !!ctx.OFF?.();
      const numTok = ctx.NUM?.();
      const nums = Array.isArray(numTok) ? numTok : numTok ? [numTok] : [];
      const numTexts = nums.map((n) => n.getText?.() as string).filter(Boolean);

      let start: number | undefined;
      let step: number | undefined;

      if (numTexts.length >= 1) {
        const v = Number.parseInt(numTexts[0], 10);
        if (!Number.isNaN(v)) {
          start = v;
        }
      }

      if (numTexts.length >= 2) {
        const v = Number.parseInt(numTexts[1], 10);
        if (!Number.isNaN(v)) {
          step = v;
        }
      }

      const visible = !isOff;
      if (visible) {
        this.db.enableSequenceNumbers();
      } else {
        this.db.disableSequenceNumbers();
      }

      const payload = {
        type: 'sequenceIndex' as const,
        sequenceIndex: start,
        sequenceIndexStep: step ?? (start !== undefined ? 1 : undefined),
        sequenceVisible: visible,
        signalType: this.db.LINETYPE.AUTONUMBER,
      };

      this.db.apply(payload);
    } catch {}
  }

  // Title statement processing
  protected processTitleStatement(ctx: any): void {
    try {
      const msgText = ctx.restOfLine?.()?.getText?.() as string | undefined;
      if (msgText !== undefined) {
        const val = msgText.startsWith(':') ? msgText.slice(1).trim() : msgText.trim();
        if (val) {
          this.db.setDiagramTitle?.(val);
        }
      }
    } catch {}
  }

  // Legacy title statement processing
  protected processLegacyTitleStatement(ctx: any): void {
    try {
      const fullText = ctx.LEGACY_TITLE?.()?.getText?.() as string | undefined;
      if (fullText) {
        const match = fullText.match(/^title\s*:\s*(.*)$/);
        if (match && match[1]) {
          const val = match[1].trim();
          if (val) {
            this.db.setDiagramTitle?.(val);
          }
        }
      }
    } catch {}
  }

  // Accessibility title statement processing
  protected processAccTitleStatement(ctx: any): void {
    try {
      const val = ctx.ACC_TITLE_VALUE?.()?.getText?.() as string | undefined;
      if (val !== undefined) {
        const trimmed = val.trim();
        if (trimmed) {
          this.db.setAccTitle?.(trimmed);
        }
      }
    } catch {}
  }

  // Accessibility description statement processing
  protected processAccDescrStatement(ctx: any): void {
    try {
      const val = ctx.ACC_DESCR_VALUE?.()?.getText?.() as string | undefined;
      if (val !== undefined) {
        const trimmed = val.trim();
        if (trimmed) {
          this.db.setAccDescription?.(trimmed);
        }
      }
    } catch {}
  }

  // Accessibility multiline description statement processing
  protected processAccDescrMultilineStatement(ctx: any): void {
    try {
      const val = ctx.ACC_DESCR_MULTILINE_VALUE?.()?.getText?.() as string | undefined;
      if (val !== undefined) {
        const trimmed = val.trim();
        if (trimmed) {
          this.db.setAccDescription?.(trimmed);
        }
      }
    } catch {}
  }
}
