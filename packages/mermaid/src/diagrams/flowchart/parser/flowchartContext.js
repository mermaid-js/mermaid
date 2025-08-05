/**
 * Context tracking for Lezer flowchart parser
 * Handles context-sensitive tokenization similar to JISON lexer modes
 */

export const trackGraphKeyword = {
  /**
   * Track whether we've seen the first graph keyword
   * This affects how direction tokens are parsed
   */
  firstGraphSeen: false,
  
  /**
   * Reset context state
   */
  reset() {
    this.firstGraphSeen = false;
  },
  
  /**
   * Mark that we've seen the first graph keyword
   */
  markFirstGraph() {
    this.firstGraphSeen = true;
  },
  
  /**
   * Check if this is the first graph keyword
   */
  isFirstGraph() {
    return !this.firstGraphSeen;
  }
};
