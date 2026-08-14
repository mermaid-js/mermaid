import { imgSnapshotTest, mermaidUrl } from '../../../helpers/util.ts';

const USECASE_FIXTURE_DIR = 'cypress/platform/dev-diagrams/diagrams/use-case';

const readUsecaseFixtures = (): string[] => {
  const fixtures = Cypress.env('usecaseFixtures');
  return Array.isArray(fixtures) && fixtures.every((fixture) => typeof fixture === 'string')
    ? fixtures
    : [];
};

const USECASE_FIXTURES = readUsecaseFixtures();

const asMermaidElementSource = (source: string): string =>
  source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FULL_DIAGRAM = `usecase-beta
  accTitle: Complete use case example
  accDescr: Actors interact with authentication, payment, notes, and JSON data.
  actor Normal("Normal User") &lt;&lt;Human&gt;&gt;
  actor Hollow@{ type: hollow, business: true }
  actor Awesome@{ type: awesome }
  actor Icon@{ icon: "fa:bell" }
  actor UnknownIcon@{ icon: "fa:not-registered" }
  actor BusinessActor@{ business: true }

  systemBoundary "Authentication System":::framed
    actor ContainedActor("Contained actor")
    Login("\`**Sign in**
securely\`") &lt;&lt;Main&gt;&gt;:::critical
    Reset[Reset password]
  end
  "Authentication System"@{ type: package }

  Payment("Payment")
  Extra("Optional flow")
  Checkout("Checkout")@{ business: true } &lt;&lt;Core&gt;&gt;
  Literal("**Literal markers**")
  Hostile("&lt;img src=x onerror=alert#40;1#41;&gt;")

  Normal assocRel@-- "\`opens **session**\`" --> Login
  Hollow circleRel@--o Reset
  Awesome crossRel@--x Normal
  Awesome generalRel@--|> Normal
  Login includeRel@..> : include Payment
  Extra extendRel@..> : extend Login
  Checkout --> Payment
  note for Login "\`Requires an **active session**\`"

  json Payload@{
    "2": "two",
    "1": "one",
    "colors": ["Red", "Green"],
    "address": { "city": "Oslo" },
    "empty": {}
  }
  Payment jsonRel@--> Payload

  classDef framed fill:#fdf6e3,stroke:#6c71c4,stroke-width:3px
  classDef critical fill:#fff3cd,stroke:#b58900
  classDef emphasized stroke:#268bd2,stroke-width:3px
  class assocRel emphasized
  style Authentication_System fill:#fdf6e3,stroke:#6c71c4,stroke-width:3px
  style Checkout stroke:#dc322f,stroke-width:4px
  style Payload fill:#eef7ff,stroke:#123456
  style assocRel stroke:#2aa198,stroke-width:5px
  assocRel@{ animate: true, animation: fast }
`;

// No classDef or style here on purpose — the theme variables must supply every colour.
const THEMED_DIAGRAM = `usecase-beta
  accTitle: Themed use case example
  accDescr: Exercises every themed element without any inline style overrides.
  actor Normal("Normal User")
  actor Hollow@{ type: hollow }
  actor Business@{ business: true }

  systemBoundary "Authentication System"
    Login("Sign in")
    Reset[Reset password]
  end

  Checkout("Checkout")@{ business: true }
  Normal --> Login
  Hollow --o Reset
  Business --> Checkout
  Login ..> : include Checkout
  note for Login "Requires an active session"

  json Payload@{
    "region": "eu",
    "tags": ["Red", "Green"]
  }
  Checkout --> Payload
`;

type MermaidOptions = Parameters<typeof mermaidUrl>[1];

const renderForDom = (source: string, options: MermaidOptions = {}) => {
  cy.visit(mermaidUrl(source, options, false));
  cy.window().should('have.property', 'rendered', true);
  cy.get('svg').should('be.visible');
};

const edge = (id: string) => cy.get(`path[data-usecase-id="${id}"]`);
const element = (id: string) => cy.get(`[data-usecase-id="${id}"]`);

describe('Usecase diagram', () => {
  describe('dev fixture coverage', () => {
    it('covers every use-case dev fixture', () => {
      expect(USECASE_FIXTURES.length, 'generated use-case fixture inventory').to.be.greaterThan(0);
      cy.task('listUsecaseFixtures').should('deep.equal', USECASE_FIXTURES);
    });

    USECASE_FIXTURES.forEach((fixture) => {
      it(`renders ${fixture} end to end`, () => {
        cy.readFile(`${USECASE_FIXTURE_DIR}/${fixture}`, 'utf8').then((source) => {
          expect(source, 'fixture should declare the usecase diagram type').to.match(
            /(?:^|\n)usecase-beta(?:\s|$)/
          );
          imgSnapshotTest(asMermaidElementSource(source));
          cy.get('svg .error-icon').should('not.exist');
          cy.get('[data-usecase-kind]').its('length').should('be.greaterThan', 0);
        });
      });
    });
  });

  it('renders the complete typed use-case contract with stable semantics', () => {
    renderForDom(FULL_DIAGRAM, {
      usecase: {
        actorFontSize: 21,
        actorFontFamily: 'Courier New',
        actorFontWeight: '600',
        usecaseFontSize: 19,
        usecaseFontFamily: 'Georgia',
        usecaseFontWeight: '500',
        nodeSpacing: 65,
        rankSpacing: 75,
        diagramPadding: 37,
        useMaxWidth: false,
      },
    });

    element('Normal').should('have.attr', 'data-usecase-kind', 'actor');
    element('Normal').should('have.attr', 'aria-label', 'actor Normal User, stereotype Human');
    element('Normal')
      .find('.usecase-actor-shape.usecase-actor-normal .usecase-actor-stick')
      .should('exist');
    element('Hollow').should('have.attr', 'aria-label', 'business hollow actor Hollow');
    element('Hollow').find('.usecase-actor-hollow-head').should('exist');
    element('Hollow').find('.usecase-actor-business-marker').should('exist');
    element('Awesome').should('have.attr', 'aria-label', 'awesome actor Awesome');
    element('Awesome').find('.usecase-actor-awesome-silhouette').should('exist');
    element('Icon').should('have.attr', 'aria-label', 'icon actor Icon');
    element('Icon').find('.usecase-actor-icon-symbol').should('exist');
    element('UnknownIcon').find('.usecase-actor-icon-fallback').should('exist');
    element('BusinessActor').should('have.attr', 'aria-label', 'business actor BusinessActor');
    element('BusinessActor').find('.usecase-actor-business-marker').should('exist');

    element('Login').should('have.attr', 'data-usecase-kind', 'usecase');
    element('Login').should(
      'have.attr',
      'aria-label',
      'use case Sign in\nsecurely, stereotype Main'
    );
    element('Login').find('ellipse').should('exist');
    element('Login').find('.usecase-stereotype').should('contain.text', '«Main»');
    element('Login').find('.label strong').should('contain.text', 'Sign in');
    element('Reset').find('rect.label-container').should('exist');
    element('Checkout').should(
      'have.attr',
      'aria-label',
      'business use case Checkout, stereotype Core'
    );
    element('Checkout')
      .find('.usecase-business-marker')
      .should('have.attr', 'style')
      .and('contain', 'stroke:#dc322f');
    element('Literal')
      .should('contain.text', '**Literal markers**')
      .find('strong')
      .should('not.exist');

    element('Authentication_System').should('have.attr', 'data-usecase-kind', 'boundary');
    element('Authentication_System').should('have.attr', 'data-boundary-type', 'package');
    element('Authentication_System').should(
      'have.attr',
      'aria-label',
      'package system boundary Authentication System'
    );
    element('Authentication_System').within(() => {
      cy.get('.boundary-tab.system-boundary-package-tab')
        .should('have.attr', 'style')
        .and('contain', 'fill:#fdf6e3')
        .and('contain', 'stroke:#6c71c4');
      cy.get('.boundary-body')
        .should('have.attr', 'style')
        .and('contain', 'fill:#fdf6e3')
        .and('contain', 'stroke:#6c71c4');
    });
    cy.get('[data-usecase-id="Authentication_System"] .boundary-body').then(($body) => {
      const body = $body[0].getBoundingClientRect();
      for (const id of ['ContainedActor', 'Login', 'Reset']) {
        element(id).then(($child) => {
          const child = $child[0].getBoundingClientRect();
          expect(child.left).to.be.at.least(body.left - 1);
          expect(child.right).to.be.at.most(body.right + 1);
          expect(child.top).to.be.at.least(body.top - 1);
          expect(child.bottom).to.be.at.most(body.bottom + 1);
        });
      }
    });
    cy.get('[data-usecase-id="Authentication_System"] .boundary-tab').then(($tab) => {
      const tab = $tab[0].getBoundingClientRect();
      element('ContainedActor').then(($child) => {
        expect($child[0].getBoundingClientRect().top).to.be.at.least(tab.bottom - 1);
      });
    });

    edge('assocRel')
      .should('have.attr', 'marker-end')
      .and('match', /pointEnd/);
    edge('assocRel').should('have.class', 'emphasized').and('have.class', 'edge-animation-fast');
    edge('assocRel').should(
      'have.attr',
      'aria-label',
      'association opens session from Normal User to Sign in\nsecurely'
    );
    edge('assocRel')
      .should('have.attr', 'style')
      .and('contain', 'stroke:#2aa198')
      .and('contain', 'stroke-width:5px');
    edge('assocRel').should(($path) => {
      expect($path.attr('id')).to.match(/^usecase-.+-assocRel$/);
      expect($path.attr('data-id')).to.equal('assocRel');
    });
    cy.get('.edgeLabel [data-id="assocRel"] strong').should('contain.text', 'session');
    edge('circleRel')
      .should('have.attr', 'marker-end')
      .and('match', /circleEnd/);
    edge('crossRel')
      .should('have.attr', 'marker-end')
      .and('match', /crossEnd/);
    edge('generalRel')
      .should('have.attr', 'marker-end')
      .and('match', /extensionEnd/);
    edge('generalRel').should(
      'have.attr',
      'aria-label',
      'generalization from Awesome to Normal User'
    );
    edge('includeRel').should('have.class', 'edge-pattern-dotted');
    edge('includeRel')
      .should('have.attr', 'marker-end')
      .and('match', /pointEnd/);
    edge('includeRel').should(
      'have.attr',
      'aria-label',
      'include from Sign in\nsecurely to Payment'
    );
    edge('extendRel').should('have.class', 'edge-pattern-dotted');
    edge('extendRel').should(
      'have.attr',
      'aria-label',
      'extend from Optional flow to Sign in\nsecurely'
    );
    cy.get('.edgeLabel [data-id="includeRel"]').should('contain.text', 'include');
    cy.get('.edgeLabel [data-id="extendRel"]').should('contain.text', 'extend');

    element('note-0').should('have.attr', 'data-usecase-kind', 'note');
    element('note-0').should(
      'have.attr',
      'aria-label',
      'Note for Sign in\nsecurely: Requires an active session'
    );
    element('note-0').find('strong').should('contain.text', 'active session');
    edge('note-0-edge').should('have.attr', 'data-usecase-kind', 'note-connector');
    edge('note-0-edge').should('have.attr', 'aria-hidden', 'true');
    edge('note-0-edge').should('have.class', 'edge-pattern-dotted');
    edge('note-0-edge').should('not.have.attr', 'marker-start');
    edge('note-0-edge').should('not.have.attr', 'marker-end');

    element('Payload').should('have.attr', 'data-usecase-kind', 'json');
    element('Payload').should(
      'have.attr',
      'aria-label',
      'Payload: 2: two; 1: one; colors: Red; colors: Green; address.city: Oslo; empty: {}'
    );
    element('Payload')
      .find('.usecase-json-border')
      .should('have.attr', 'style')
      .and('contain', 'fill:#eef7ff')
      .and('contain', 'stroke:#123456');
    element('Payload').find('.usecase-json-title').should('contain.text', 'Payload');
    element('Payload')
      .find('.usecase-json-row')
      .should('have.length', 6)
      .then(($rows) => {
        expect([...$rows].map((row) => row.textContent?.replace(/\s+/g, ' ').trim())).to.deep.equal(
          ['2two', '1one', 'colorsRed', 'Green', 'address.cityOslo', 'empty{}']
        );
      });

    element('Hostile').find('img, script, [onerror]').should('not.exist');
    cy.get('svg > title').should('contain.text', 'Complete use case example');
    cy.get('svg > desc').should(
      'contain.text',
      'Actors interact with authentication, payment, notes, and JSON data.'
    );

    cy.get('svg').should(($svg) => {
      const svg = $svg[0] as unknown as SVGSVGElement;
      expect(svg.style.getPropertyValue('--mermaid-usecase-actor-font-size')).to.equal('21px');
      expect(svg.style.getPropertyValue('--mermaid-usecase-font-size')).to.equal('19px');
      expect(svg.getAttribute('width')).not.to.equal('100%');
      expect(svg.getAttribute('style')).not.to.match(/max-width/);
      const [, , viewBoxWidth, viewBoxHeight] = (svg.getAttribute('viewBox') ?? '')
        .split(/\s+/)
        .map(Number);
      const bounds = svg.getBBox();
      expect(viewBoxWidth - bounds.width).to.be.closeTo(74, 1);
      expect(viewBoxHeight - bounds.height).to.be.closeTo(74, 1);
    });
    element('Normal').find('.nodeLabel p').should('have.css', 'font-size', '21px');
    element('Login').find('.nodeLabel p').should('have.css', 'font-size', '19px');
    element('Normal').should(($node) => {
      expect($node.attr('id')).to.match(/-usecase-Normal$/);
    });
  });

  it('honors max-width independently of padding and font configuration', () => {
    renderForDom(
      `usecase-beta
        systemBoundary "Plain Boundary"
          actor User
          Login("Sign in")
        end
        User --> Login`,
      {
        usecase: {
          actorFontSize: 18,
          usecaseFontSize: 17,
          diagramPadding: 12,
          useMaxWidth: true,
        },
      }
    );

    cy.get('svg').should(($svg) => {
      expect($svg.attr('width')).to.equal('100%');
      expect($svg.attr('style')).to.match(/max-width: [\d.]+px/);
    });
    element('Plain_Boundary').should('have.attr', 'data-boundary-type', 'rect');
    element('Plain_Boundary').should('have.class', 'usecase-system-boundary-rect');
    element('Plain_Boundary').find('.boundary-body').should('exist');
    element('Plain_Boundary').find('.boundary-tab').should('not.exist');
  });

  it('renders clustered minlen relationships through the registered ELK layout', () => {
    renderForDom(
      `usecase-beta
        systemBoundary "External Layout"
          actor User
          Login("Sign in")
        end
        User longEdge@---> Login`,
      {
        layout: 'elk',
        usecase: {
          nodeSpacing: 40,
          rankSpacing: 55,
          diagramPadding: 16,
        },
      }
    );

    element('External_Layout').should('have.attr', 'data-boundary-type', 'rect');
    element('User').should('have.attr', 'data-usecase-kind', 'actor');
    element('Login').should('have.attr', 'data-usecase-kind', 'usecase');
    edge('longEdge').should('have.attr', 'data-usecase-kind', 'relationship');
    edge('longEdge')
      .should('have.attr', 'marker-end')
      .and('match', /pointEnd/);

    element('External_Layout')
      .find('.boundary-body')
      .then(($body) => {
        const body = $body[0].getBoundingClientRect();
        for (const id of ['User', 'Login']) {
          element(id).then(($child) => {
            const child = $child[0].getBoundingClientRect();
            expect(child.left).to.be.at.least(body.left - 1);
            expect(child.right).to.be.at.most(body.right + 1);
            expect(child.top).to.be.at.least(body.top - 1);
            expect(child.bottom).to.be.at.most(body.bottom + 1);
          });
        }
      });
  });

  it('keeps a small representative visual snapshot', () => {
    imgSnapshotTest(FULL_DIAGRAM, { usecase: { diagramPadding: 24, useMaxWidth: true } });
  });

  it('keeps the complete hand-drawn rendering contract covered', () => {
    imgSnapshotTest(FULL_DIAGRAM, {
      look: 'handDrawn',
      usecase: { diagramPadding: 24, useMaxWidth: true },
    });
  });

  it('keeps empty-diagram rendering covered without duplicating feature snapshots', () => {
    imgSnapshotTest('usecase-beta');
  });

  // THEMED_DIAGRAM deliberately carries no classDef/style, so every colour on screen comes
  // from a theme variable. clusterBkg (system boundary), noteBkgColor/noteBorderColor (note),
  // and the actor/use-case fills are the ones most likely to regress on a dark background.
  for (const theme of ['default', 'dark', 'forest', 'neutral', 'base'] as const) {
    it(`renders every themed element on the ${theme} theme`, () => {
      imgSnapshotTest(THEMED_DIAGRAM, {
        theme,
        usecase: { diagramPadding: 24, useMaxWidth: true },
      });
    });
  }
});
