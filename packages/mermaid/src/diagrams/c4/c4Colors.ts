// @ts-expect-error Incorrect khroma types
import { darken, isValid, lighten, luminance } from 'khroma';

/** WCAG AA for normal text. */
const CONTRAST_TARGET = 4.5;

/**
 * WCAG relative-contrast ratio. khroma's own `contrast` omits the `+ 0.05` terms and
 * clamps the result to 10, which saturates for most real colour pairs, so it cannot
 * tell an adequate pairing from a comfortable one.
 */
const contrastRatio = (one: string, other: string): number => {
  const [brighter, darker] = [luminance(one), luminance(other)].sort((a, b) => b - a);
  return (brighter + 0.05) / (darker + 0.05);
};

/**
 * `color` shifted one way until it reads against `background`, or as far as shifting
 * that way gets. Bounded at 12 steps of 5%, and stops early on a colour that has run
 * into black or white.
 */
const shiftUntilReadable = (
  color: string,
  background: string,
  shift: (color: string, amount: number) => string
): string => {
  let candidate = color;
  for (let step = 0; step < 12 && contrastRatio(candidate, background) < CONTRAST_TARGET; step++) {
    const next = shift(candidate, 5);
    if (next === candidate) {
      break;
    }
    candidate = next;
  }
  return candidate;
};

/**
 * A palette colour shifted until it reads against `background`, so the C4 outline look
 * stays legible on a dark theme as well as a light one.
 *
 * Both directions are tried and the better result wins, rather than picking one from
 * whether the background counts as dark. That test pivots at half luminance, while the
 * point where lightening stops beating darkening sits nearer a fifth of it - so on a
 * mid-grey background, choosing by darkness lightens a dark colour towards the grey and
 * ends up worse than leaving it alone. Trying both cannot regress: the winner is at
 * least as readable as the input.
 *
 * Colours that cannot be parsed are returned untouched, so an unusable config value
 * reaches CSS as-is and is dropped there rather than becoming `NaN`.
 */
export const readableOn = (color: string, background: string): string => {
  if (!isValid(color) || !isValid(background)) {
    return color;
  }
  if (contrastRatio(color, background) >= CONTRAST_TARGET) {
    return color;
  }
  const lightened = shiftUntilReadable(color, background, lighten);
  const darkened = shiftUntilReadable(color, background, darken);
  return contrastRatio(lightened, background) >= contrastRatio(darkened, background)
    ? lightened
    : darkened;
};
