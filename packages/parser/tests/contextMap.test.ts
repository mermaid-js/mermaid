import { parse } from '../src/parse.js';
import { describe, expect, it } from 'vitest';
import { expandToString as s } from 'langium/generate';
import { isContextMap as isModel } from '../src/language/generated/ast.js';
import type {
  ContextMap as Model,
  ContextMapNode,
  ContextMapLink,
} from '../src/language/generated/ast.js';

describe('contextMap parsing', () => {
  const exampleGrammar = `
context-map-beta

/* Example Context Map written with 'ContextMapper DSL' */
  ContextMap InsuranceContextMap {
      
      /* Add bounded contexts to this context map: */
      contains CustomerManagementContext
      contains CustomerSelfServiceContext
      contains PrintingContext
      contains PolicyManagementContext
      contains RiskManagementContext
      contains DebtCollection
      
      /* Define the context relationships: */ 
  
      CustomerSelfServiceContext [D,C]<-[U,S] CustomerManagementContext
      
      CustomerManagementContext [D,ACL]<-[U,OHS,PL] PrintingContext
      
      PrintingContext [U,OHS,PL]->[D,ACL] PolicyManagementContext
      
      RiskManagementContext [P]<->[P] PolicyManagementContext
  
      PolicyManagementContext [D,CF]<-[U,OHS,PL] CustomerManagementContext
  
      DebtCollection [D,ACL]<-[U,OHS,PL] PrintingContext
  
      PolicyManagementContext [SK]<->[SK] DebtCollection    
  }
  `;

  it('should not produce error', async () => {
    const actionShouldNotFail = async () => {
      await parse('contextMap', exampleGrammar);
    };

    await expect(actionShouldNotFail()).resolves.not.toThrow();
  });

  it('validate model', async () => {
    const ast: Model = await parse('contextMap', exampleGrammar);

    expect(isModel(ast)).toBeTruthy();
  });

  it('the grammar contains the right number of entities', async () => {
    const ast: Model = await parse('contextMap', exampleGrammar);

    expect(ast.blocks[0].body.length).toBe(13);
    expect(ast.blocks[0].body?.filter((n) => n.$type === 'ContextMapNode').length).toBe(6);
    expect(ast.blocks[0].body?.filter((n) => n.$type === 'ContextMapLink').length).toBe(7);
  });

  it('parse simple model', async () => {
    const ast: Model = await parse('contextMap', exampleGrammar);

    const text = s`
    Body:
      name: ${ast.blocks[0].name}
      Nodes: 
        ${ast.blocks[0].body
          ?.filter((n) => n.$type === 'ContextMapNode')
          .map((rawNode) => {
            const node = rawNode as ContextMapNode;
            return s`
        Node:
          name: ${node.name}
        `;
          })
          ?.join('\n')}
      Edges: 
        ${ast.blocks[0].body
          ?.filter((n) => n.$type === 'ContextMapLink')
          .map((rawLink) => {
            const link = rawLink as ContextMapLink;
            return s`
            Edge:
              direction: ${link.direction}
              LeftNode: 
                name: ${link.leftNode.$refText}
                labels: ${link.leftLabelBox?.labels.join(',')}
              RightNode: 
                name: ${link.rightNode.$refText}
                labels: ${link.leftLabelBox?.labels.join(',')}
            `;
          })
          ?.join('\n')}
    `;
    expect(text).toBe(s`
    Body:
      name: InsuranceContextMap
      Nodes:
        Node:
          name: CustomerManagementContext
        Node:
          name: CustomerSelfServiceContext
        Node:
          name: PrintingContext
        Node:
          name: PolicyManagementContext
        Node:
          name: RiskManagementContext
        Node:
          name: DebtCollection
      Edges: 
        Edge:
          direction: <-
          LeftNode:
            name: CustomerSelfServiceContext
            labels: D,C
          RightNode:
            name: CustomerManagementContext
            labels: D,C
        Edge:
          direction: <-
          LeftNode:
            name: CustomerManagementContext
            labels: D,ACL
          RightNode:
            name: PrintingContext
            labels: D,ACL
        Edge:
          direction: ->
          LeftNode:
            name: PrintingContext
            labels: U,OHS,PL
          RightNode:
            name: PolicyManagementContext
            labels: U,OHS,PL
        Edge:
          direction: <->
          LeftNode:
            name: RiskManagementContext
            labels: P
          RightNode:
            name: PolicyManagementContext
            labels: P
        Edge:
          direction: <-
          LeftNode:
            name: PolicyManagementContext
            labels: D,CF
          RightNode:
            name: CustomerManagementContext
            labels: D,CF
        Edge:
          direction: <-
          LeftNode:
            name: DebtCollection
            labels: D,ACL
          RightNode:
            name: PrintingContext
            labels: D,ACL
        Edge:
          direction: <->
          LeftNode:
            name: PolicyManagementContext
            labels: SK
          RightNode:
            name: DebtCollection
            labels: SK
    `);
  });
});
