/**
 * Matches single and multiline accessible description
 */
export const accessibilityDescrRegex = /accDescr(?:[\t ]*:[\t ]*([^\n\r]*)|\s*{([^}]*)})/y;

/**
 * Matches single line accessible title
 */
export const accessibilityTitleRegex = /accTitle[\t ]*:[\t ]*([^\n\r]*)/y;

/**
 * Matches a single line title
 */
export const titleRegex = /title([\t ]+([^\n\r]*)|)/y;
