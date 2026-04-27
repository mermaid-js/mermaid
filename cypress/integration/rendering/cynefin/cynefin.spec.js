import { imgSnapshotTest } from '../../helpers/util';

describe('cynefin framework', () => {
  it('should render a simple cynefin diagram with all five domains', () => {
    imgSnapshotTest(
      `cynefin-beta
        title Incident Response

        complex
          "Investigate root cause"
          "Run chaos experiment"

        complicated
          "Analyze performance data"
          "Expert review needed"

        clear
          "Restart service"
          "Apply known fix"

        chaotic
          "Page on-call immediately"

        confusion
          "Unknown failure mode"
      `
    );
  });

  it('should render a cynefin diagram with transitions', () => {
    imgSnapshotTest(
      `cynefin-beta
        title Strategy Categorization

        complex
          "Market research"

        complicated
          "Competitive analysis"

        clear
          "Standard pricing"

        chaotic
          "Crisis management"

        complex --> complicated : "Pattern identified"
        complicated --> clear : "Best practice codified"
        clear --> chaotic : "Complacency"
        chaotic --> complex : "Stabilized"
      `
    );
  });

  it('should render an empty cynefin framework', () => {
    imgSnapshotTest(
      `cynefin-beta
        title Empty Framework

        complex
        complicated
        clear
        chaotic
      `
    );
  });

  it('should render cynefin with many items per domain', () => {
    imgSnapshotTest(
      `cynefin-beta
        title Software Delivery

        complex
          "New product discovery"
          "User behavior analysis"
          "A/B testing strategy"

        complicated
          "Performance optimization"
          "Security audit"
          "Database migration"

        clear
          "Deploy to staging"
          "Run test suite"
          "Merge pull request"

        chaotic
          "Production outage"
          "Data breach response"
      `
    );
  });

  it('should render cynefin with config override', () => {
    imgSnapshotTest(
      `cynefin-beta
        complex
          "Adaptive work"
        clear
          "Standard work"
      `,
      { 'cynefin-beta': { width: 1000, height: 700, boundaryAmplitude: 15 } }
    );
  });

  it('should render cynefin without domain descriptions', () => {
    imgSnapshotTest(
      `cynefin-beta
        title Minimal Labels

        complex
          "Item A"
        clear
          "Item B"
      `,
      { 'cynefin-beta': { showDomainDescriptions: false } }
    );
  });

  it('should render cynefin with theme override', () => {
    imgSnapshotTest(
      `cynefin-beta
        complex
          "Test item"
        clear
          "Standard"
      `,
      {
        theme: 'base',
        themeVariables: {
          cynefin: {
            complexBg: '#FFE4B5',
            clearBg: '#E6E6FA',
            boundaryColor: '#FF0000',
          },
        },
      }
    );
  });

  it('should render cynefin with straight boundaries when amplitude is zero', () => {
    imgSnapshotTest(
      `cynefin-beta
        title Straight Boundaries

        complex
          "Item A"
        complicated
          "Item B"
        clear
          "Item C"
        chaotic
          "Item D"
      `,
      { 'cynefin-beta': { boundaryAmplitude: 0 } }
    );
  });

  it('should render cynefin with confusion domain items without overflow', () => {
    imgSnapshotTest(
      `cynefin-beta
        title Confusion Items

        confusion
          "Unknown A"
          "Unknown B"
          "Unknown C"
          "Unknown D"
          "Unknown E"
      `
    );
  });

  it('should render cynefin with self-loop transitions silently dropped', () => {
    imgSnapshotTest(
      `cynefin-beta
        title Self-loop Handling

        complex
          "Emergent work"
        complicated
          "Expert work"

        complex --> complicated : "Pattern found"
        complex --> complex : "Self-loop (dropped)"
      `
    );
  });

  it('should render cynefin with accessibility directives', () => {
    imgSnapshotTest(
      `cynefin-beta
        accTitle: Cynefin framework for software delivery
        accDescr: A Cynefin map categorizing software tasks by complexity domain

        complex
          "Feature discovery"
        complicated
          "Refactoring"
        clear
          "Hotfix"
        chaotic
          "Incident"
      `
    );
  });
});
