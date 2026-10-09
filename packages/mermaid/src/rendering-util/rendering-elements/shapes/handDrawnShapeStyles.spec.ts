import { describe, expect, it } from 'vitest';
import type { Node } from '../../types.js';
import { styles2String } from './handDrawnShapeStyles.js';

describe('hand drawn shape styles', () => {
  it('normalizes string label styles before compiling node styles', () => {
    const styles = styles2String({
      id: 'styled-node',
      isGroup: false,
      cssStyles: ['fill:#f9F', 'stroke:#333'],
      labelStyle: 'color:#fff;text-align:center;',
    } as Node);

    expect(styles.nodeStyles).toContain('fill:#f9F !important');
    expect(styles.nodeStyles).toContain('stroke:#333 !important');
    expect(styles.labelStyles).toContain('color:#fff !important');
    expect(styles.labelStyles).toContain('text-align:center !important');
  });
});
