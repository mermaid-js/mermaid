describe('Interaction', () => {
  describe('Security level loose', () => {
    beforeEach(() => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
    });

    it('Graph: should handle a click on a node with a bound function', () => {
      cy.contains('FunctionTest1').parents('.node').click();
      cy.get('.created-by-click').should('have.text', 'Clicked By Flow');
    });

    it('Graph: should handle a click on a node with a bound function with args', () => {
      cy.contains('FunctionArgTest2').parents('.node').click();
      cy.get('.created-by-click-2').should('have.text', 'Clicked By Flow: ARGUMENT');
    });

    it('Flowchart: should handle a click on a node with a bound function where the node starts with a number', () => {
      cy.contains('2FunctionArg').parents('.node').click();
      cy.get('.created-by-click-2').should('have.text', 'Clicked By Flow: ARGUMENT');
    });

    it('Graph: should handle a click on a node with a bound url', () => {
      // When there is a URL, cy.contains selects the a tag instead of the span. The .node is a child of a, so we have to use find instead of parent.
      cy.contains('URLTest1').find('.node').click();
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('Graph: should handle a click on a node with a bound url where the node starts with a number', () => {
      cy.contains('2URL').find('.node').click();
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('Flowchart-v2: should handle a click on a node with a bound function', () => {
      cy.contains('FunctionTest2').parents('.node').click();
      cy.get('.created-by-click').should('have.text', 'Clicked By Flow');
    });

    it('Flowchart-v2: should handle a click on a node with a bound function where the node starts with a number', () => {
      cy.contains('10Function').parents('.node').click();
      cy.get('.created-by-click').should('have.text', 'Clicked By Flow');
    });

    it('Flowchart-v2: should handle a click on a node with a bound url', () => {
      cy.contains('URLTest2').find('.node').click();
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('Flowchart-v2: should handle a click on a node with a bound url where the node starts with a number', () => {
      // cy.contains('').click();
      cy.contains('20URL').find('.node').click();
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a task with a bound URL clicking on the rect', () => {
      cy.get('body').find('rect#cl1').click({ force: true });
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a task with a bound URL clicking on the text', () => {
      cy.get('body').find('text#cl1-text').click({ force: true });
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a task with a bound function without args', () => {
      cy.get('body').find('rect#cl2').click({ force: true });
      cy.get('.created-by-gant-click').should('have.text', 'Clicked By Gant cl2');
    });

    it('should handle a click on a task with a bound function with args', () => {
      cy.get('body').find('rect#cl3').click({ force: true });
      cy.get('.created-by-gant-click').should('have.text', 'Clicked By Gant test1 test2 test3');
    });

    it('should handle a click on a task with a bound function without args', () => {
      cy.get('body').find('text#cl2-text').click({ force: true });
      cy.get('.created-by-gant-click').should('have.text', 'Clicked By Gant cl2');
    });

    it('should handle a click on a task with a bound function with args ', () => {
      cy.get('body').find('text#cl3-text').click({ force: true });
      cy.get('.created-by-gant-click').should('have.text', 'Clicked By Gant test1 test2 test3');
    });
  });

  describe('Interaction - security level tight', () => {
    beforeEach(() => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
    });
    it('should handle a click on a node without a bound function', () => {
      cy.get('body').find('g#flowchart-Function-4').click();
      cy.get('.created-by-click').should('not.exist');
    });

    it('should handle a click on a node with a bound function where the node starts with a number', () => {
      cy.get('body').find('g[id="flowchart-1Function-10"]').click();
      cy.get('.created-by-click').should('not.exist');
    });

    it('should handle a click on a node with a bound url', () => {
      cy.get('body').find('g#flowchart-URL-5').click();
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a node with a bound url where the node starts with a number', () => {
      cy.get('body').find('g[id="flowchart-2URL-11"]').click();
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a task with a bound URL clicking on the rect', () => {
      cy.get('body').find('rect#cl1').click({ force: true });
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a task with a bound URL clicking on the text', () => {
      cy.get('body').find('text#cl1-text').click({ force: true });
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a task with a bound function', () => {
      cy.get('body').find('rect#cl2').click({ force: true });
      cy.get('.created-by-gant-click').should('not.exist');
    });

    it('should handle a click on a task with a bound function', () => {
      cy.get('body').find('text#cl2-text').click({ force: true });
      cy.get('.created-by-gant-click').should('not.exist');
    });
  });

  describe('Interaction - security level other, missspelling', () => {
    beforeEach(() => {
      const url = 'http://localhost:9000/click_security_other.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
    });

    it('should handle a click on a node with a bound function', () => {
      cy.get('body').find('g#flowchart-Function-4').click();
      cy.get('.created-by-click').should('not.exist');
    });

    it('should handle a click on a node with a bound function where the node starts with a number', () => {
      cy.get('body').find('g[id="flowchart-1Function-10"]').click();
      cy.get('.created-by-click').should('not.exist');
      cy.get('.created-by-click').should('not.exist');
    });

    it('should handle a click on a node with a bound url', () => {
      cy.get('body').find('g#flowchart-URL-5').click();
      cy.location().should(({ href }) => {
        expect(href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a task with a bound function', () => {
      cy.get('body').find('rect#cl2').click({ force: true });
      cy.get('.created-by-gant-click').should('not.exist');
    });

    it('should handle a click on a task with a bound function', () => {
      cy.get('body').find('text#cl2-text').click({ force: true });
      cy.get('.created-by-gant-click').should('not.exist');
    });
  });
});
