// @ts-expect-error Incorrect khroma types
import { darken, isValid, lighten, luminance } from 'khroma';

/** WCAG AA for normal text. */
const CONTRAST_TARGET = 4.5;

/** Percentage points of HSL lightness each shift moves a colour. */
const SHIFT_STEP = 5;

/** Enough steps to take any colour all the way to black or to white. */
const MAX_SHIFT_STEPS = Math.ceil(100 / SHIFT_STEP);

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
 * that way gets: at most the steps that reach black or white, and fewer once a step no
 * longer changes the colour.
 */
const shiftUntilReadable = (
  color: string,
  background: string,
  shift: (color: string, amount: number) => string
): string => {
  let candidate = color;
  for (
    let step = 0;
    step < MAX_SHIFT_STEPS && contrastRatio(candidate, background) < CONTRAST_TARGET;
    step++
  ) {
    const next = shift(candidate, SHIFT_STEP);
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
