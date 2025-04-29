import { describe, it, expect, beforeAll } from 'vitest';
import { parse } from '@mermaid-js/parser';
import type { UseCase as Parsed } from '@mermaid-js/parser-generated';

let ast: Parsed;
// let ast: Awaited<ReturnType<typeof parse>>;

const src = String.raw`use-case-beta
actor Admin position right
actor User
("Place Order")
("Log in")
User --> "Place Order"
"Place Order" -[include]-> "Log in"
`;

beforeAll(async () => {
  ast = await parse('use_case', src);
});

describe('Use-Case diagram parser', () => {
  it('parses the diagram without throwing', () => {
    // If we reached here, beforeAll already succeeded
    expect(ast.$type).toBe('UseCaseDiagram');
  });

  it('recognises two actors with correct positions', () => {
    expect(ast.actors).toHaveLength(2);
    const rightActor = ast.actors.find((a) => a.position === 'right');
    expect(rightActor?.id).toBe('Admin');
  });

  it('captures all explicit use-cases', () => {
    const names = ast.useCases.map((u) => u.name.replace(/"/g, ''));
    expect(names).toEqual(['Place Order', 'Log in']);
  });

  it('produces two edges and labels the include relationship', () => {
    expect(ast.edges).toHaveLength(2);
    const includeEdge = ast.edges.find((e) => e.title);
    expect(includeEdge?.title).toBe('[include]');
    expect(includeEdge?.lhsId.replace(/"/g, '')).toBe('Place Order');
  });
});
