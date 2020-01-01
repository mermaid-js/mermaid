/* eslint-env jest */
describe('Interaction', () => {
  describe('Interaction - security level loose', () => {
    it('should handle a click on a node with a bound function', () => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g#Function')
        .click();

      cy.get('.created-by-click').should('have.text', 'Clicked By Flow');
    });
    it('should handle a click on a node with a bound function where the node starts with a number', () => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g[id="1Function"]')
        .click();

      cy.get('.created-by-click').should('have.text', 'Clicked By Flow');
    });
    it('should handle a click on a node with a bound url', () => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g#URL')
        .click();

      cy.location().should(location => {
        expect(location.href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });
    it('should handle a click on a node with a bound url where the node starts with a number', () => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g[id="2URL"]')
        .click();

      cy.location().should(location => {
        expect(location.href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a task with a bound URL clicking on the rect', () => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('rect#cl1')
        .click({ force: true });

      cy.location().should(location => {
        expect(location.href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });
    it('should handle a click on a task with a bound URL clicking on the text', () => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('text#cl1-text')
        .click({ force: true });

      cy.location().should(location => {
        expect(location.href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });
    it('should handle a click on a task with a bound function without args', () => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('rect#cl2')
        .click({ force: true });

      cy.get('.created-by-gant-click').should('have.text', 'Clicked By Gant cl2');
    });
    it('should handle a click on a task with a bound function with args', () => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('rect#cl3')
        .click({ force: true });

      cy.get('.created-by-gant-click').should('have.text', 'Clicked By Gant test1 test2 test3');
    });

    it('should handle a click on a task with a bound function without args', () => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('text#cl2-text')
        .click({ force: true });

      cy.get('.created-by-gant-click').should('have.text', 'Clicked By Gant cl2');
    });
    it('should handle a click on a task with a bound function with args ', () => {
      const url = 'http://localhost:9000/click_security_loose.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('text#cl3-text')
        .click({ force: true });

      cy.get('.created-by-gant-click').should('have.text', 'Clicked By Gant test1 test2 test3');
    });

  });

  describe('Interaction - security level tight', () => {
    it('should handle a click on a node without a bound function', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g#Function')
        .click();

      cy.get('.created-by-click').should('not.have.text', 'Clicked By Flow');
    });
    it('should handle a click on a node with a bound function where the node starts with a number', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g[id="1Function"]')
        .click();

      cy.get('.created-by-click').should('not.have.text', 'Clicked By Flow');
    });
    it('should handle a click on a node with a bound url', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g#URL')
        .click();

      cy.location().should(location => {
        expect(location.href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });
    it('should handle a click on a node with a bound url where the node starts with a number', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g[id="2URL"]')
        .click();

      cy.location().should(location => {
        expect(location.href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a task with a bound URL clicking on the rect', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('rect#cl1')
        .click({ force: true });

      cy.location().should(location => {
        expect(location.href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });
    it('should handle a click on a task with a bound URL clicking on the text', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('text#cl1-text')
        .click({ force: true });

      cy.location().should(location => {
        expect(location.href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });
    it('should handle a click on a task with a bound function', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('rect#cl2')
        .click({ force: true });

      cy.get('.created-by-gant-click').should('not.have.text', 'Clicked By Gant cl2');
    });
    it('should handle a click on a task with a bound function', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('text#cl2-text')
        .click({ force: true });

      cy.get('.created-by-gant-click').should('not.have.text', 'Clicked By Gant cl2');
    });
  });

  describe('Interaction - security level other, missspelling', () => {
    it('should handle a click on a node with a bound function', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g#Function')
        .click();

      cy.get('.created-by-click').should('not.have.text', 'Clicked By Flow');
    });
    it('should handle a click on a node with a bound function where the node starts with a number', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g[id="1Function"]')
        .click();

      cy.get('.created-by-click').should('not.have.text', 'Clicked By Flow');
    });
    it('should handle a click on a node with a bound url', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('g#URL')
        .click();

      cy.location().should(location => {
        expect(location.href).to.eq('http://localhost:9000/webpackUsage.html');
      });
    });

    it('should handle a click on a task with a bound function', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('rect#cl2')
        .click({ force: true });

      cy.get('.created-by-gant-click').should('not.have.text', 'Clicked By Gant cl2');
    });
    it('should handle a click on a task with a bound function', () => {
      const url = 'http://localhost:9000/click_security_strict.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('body')
        .find('text#cl2-text')
        .click({ force: true });

      cy.get('.created-by-gant-click').should('not.have.text', 'Clicked By Gant cl2');
    });
  });
});
