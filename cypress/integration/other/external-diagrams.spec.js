describe('mermaid', () => {
  describe('registerDiagram', () => {
    it('should work on @mermaid-js/mermaid-mindmap and mermaid-example-diagram', () => {
      const url = 'http://localhost:9000/external-diagrams-mindmap.html';
      cy.visit(url);

      cy.get('svg', {
        // may be a bit slower than normal, since vite might need to re-compile mermaid/mermaid-mindmap/mermaid-example-diagram
        timeout: 10000,
      }).matchImageSnapshot();
    });
  });
});
