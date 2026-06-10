/**
 * Ambient declarations for the `khroma` package.
 *
 * khroma v2.1.0 ships its own type declarations, but they cannot be resolved
 * under `moduleResolution: nodenext` because its `dist/index.d.ts` re-exports
 * from extensionless relative paths (`export * from './methods'`).
 *
 * Only the functions actually used by mermaid are declared here. The
 * signatures mirror `khroma/dist/methods/*.d.ts` and `khroma/dist/types.d.ts`.
 */
declare module 'khroma' {
  export type Channel = 'r' | 'g' | 'b' | 'h' | 's' | 'l' | 'a';

  export function adjust(color: string, channels: Partial<Record<Channel, number>>): string;

  export function channel(color: string, channel: Channel): number;

  /**
   * khroma's own types require `amount`, but some theme files intentionally
   * call `darken(color)`/`lighten(color)` with a single argument (preserved
   * verbatim from the original JavaScript), so it is declared optional here.
   */
  export function darken(color: string, amount?: number): string;

  export function invert(color: string, weight?: number): string;

  export function isDark(color: string): boolean;

  /** See {@link darken} for why `amount` is optional. */
  export function lighten(color: string, amount?: number): string;

  export function mix(color1: string, color2: string, weight?: number): string;

  export function rgba(color: string, opacity: number): string;
  export function rgba(r: number, g: number, b: number, a?: number): string;

  export function transparentize(color: string, amount: number): string;
}
