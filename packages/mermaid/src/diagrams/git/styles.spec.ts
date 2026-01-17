import { describe, it, expect } from 'vitest';
import getStyles from './styles.js';

describe('git styles', () => {
  describe('branch label font size', () => {
    it('should apply gitBranchLabelFontSize to branch labels using attribute selector', () => {
      const options = {
        gitBranchLabelFontSize: '20px',
        gitBranchLabel0: '#ffffff',
        gitBranchLabel1: '#000000',
        git0: '#ff0000',
        git1: '#00ff00',
        gitInv0: '#0000ff',
        gitInv1: '#ffff00',
        commitLabelFontSize: '10px',
        commitLabelColor: '#000000',
        commitLabelBackground: '#ffffff',
        tagLabelFontSize: '10px',
        tagLabelColor: '#000000',
        tagLabelBackground: '#ffffff',
        tagLabelBorder: '#000000',
        primaryColor: '#000000',
        lineColor: '#000000',
        textColor: '#000000',
      };

      const styles = getStyles(options);

      // Check that the attribute selector is used for branch labels
      expect(styles).toContain('[class*="branch-label"]');
      expect(styles).toContain('font-size: 20px');

      // Ensure branch-label0, branch-label1, etc. get their fill colors
      expect(styles).toContain('.branch-label0 { fill: #ffffff; }');
      expect(styles).toContain('.branch-label1 { fill: #000000; }');
    });

    it('should use default font size when gitBranchLabelFontSize is not provided', () => {
      const options = {
        gitBranchLabel0: '#ffffff',
        gitBranchLabel1: '#000000',
        git0: '#ff0000',
        git1: '#00ff00',
        gitInv0: '#0000ff',
        gitInv1: '#ffff00',
        commitLabelFontSize: '10px',
        commitLabelColor: '#000000',
        commitLabelBackground: '#ffffff',
        tagLabelFontSize: '10px',
        tagLabelColor: '#000000',
        tagLabelBackground: '#ffffff',
        tagLabelBorder: '#000000',
        primaryColor: '#000000',
        lineColor: '#000000',
        textColor: '#000000',
      };

      const styles = getStyles(options);

      // Should still have the attribute selector
      expect(styles).toContain('[class*="branch-label"]');
      // Should use undefined (which will fall back to theme default)
      expect(styles).toMatch(/\[class\*="branch-label"]\s*{\s*font-size:\s*undefined/);
    });

    it('should generate styles for all 8 theme color variations', () => {
      const options = {
        gitBranchLabelFontSize: '16px',
        gitBranchLabel0: '#000000',
        gitBranchLabel1: '#111111',
        gitBranchLabel2: '#222222',
        gitBranchLabel3: '#333333',
        gitBranchLabel4: '#444444',
        gitBranchLabel5: '#555555',
        gitBranchLabel6: '#666666',
        gitBranchLabel7: '#777777',
        git0: '#ff0000',
        git1: '#ff0000',
        git2: '#ff0000',
        git3: '#ff0000',
        git4: '#ff0000',
        git5: '#ff0000',
        git6: '#ff0000',
        git7: '#ff0000',
        gitInv0: '#00ff00',
        gitInv1: '#00ff00',
        gitInv2: '#00ff00',
        gitInv3: '#00ff00',
        gitInv4: '#00ff00',
        gitInv5: '#00ff00',
        gitInv6: '#00ff00',
        gitInv7: '#00ff00',
        commitLabelFontSize: '10px',
        commitLabelColor: '#000000',
        commitLabelBackground: '#ffffff',
        tagLabelFontSize: '10px',
        tagLabelColor: '#000000',
        tagLabelBackground: '#ffffff',
        tagLabelBorder: '#000000',
        primaryColor: '#000000',
        lineColor: '#000000',
        textColor: '#000000',
      };

      const styles = getStyles(options);

      // Check that all 8 branch label classes are generated
      for (let i = 0; i < 8; i++) {
        expect(styles).toContain(`.branch-label${i}`);
      }
    });

    it('should apply commit and tag label font sizes independently', () => {
      const options = {
        gitBranchLabelFontSize: '20px',
        commitLabelFontSize: '12px',
        tagLabelFontSize: '14px',
        gitBranchLabel0: '#ffffff',
        git0: '#ff0000',
        gitInv0: '#00ff00',
        commitLabelColor: '#000000',
        commitLabelBackground: '#ffffff',
        tagLabelColor: '#000000',
        tagLabelBackground: '#ffffff',
        tagLabelBorder: '#000000',
        primaryColor: '#000000',
        lineColor: '#000000',
        textColor: '#000000',
      };

      const styles = getStyles(options);

      // Check that each label type has its own font size
      expect(styles).toContain('[class*="branch-label"] { font-size: 20px; }');
      expect(styles).toContain('.commit-label { font-size: 12px;');
      expect(styles).toContain('.tag-label { font-size: 14px;');
    });
  });
});
