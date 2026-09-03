/**
 * `colorIndex` is what drives every palette slot under the `redux-color` /
 * `redux-dark-color` themes: `usecaseDb` assigns it, the use case shapes and
 * `usecaseSystemBoundary` stamp it as `data-color-id`, and `usecase/styles.ts` maps it to a
 * border and fill.
 *
 * Two counters feed it, and they are not interchangeable. System boundaries are numbered
 * from zero in declaration order and take a palette slot under *both* colour schemes, the
 * way flowchart subgraphs do -- numbering the containers says which group a thing belongs
 * to, which is real information. Actors and use cases share a second cycle that only the
 * opt-in `usecase.colorScheme: 'rotate'` consumes; by default they take role colours, which
 * `usecaseRoleColors.spec.ts` covers.
 *
 * The slot is assigned unconditionally, because `getData` has no business knowing which
 * theme or scheme is active; the stamp and the rules are what the scheme gates. So these
 * assertions hold whatever `colorScheme` is set to.
 *
 * The failure mode is silent. If the slots stop being assigned, or start being shared,
 * every element falls back to `color-0` and a rotating diagram renders in one colour --
 * which looks like a theme problem, not a db problem. So pin the assignment here rather
 * than relying on a screenshot to notice.
 *
 * Unlike class and ER, three different kinds share one cycle here, so the ordering between
 * kinds is part of the contract and not just an implementation detail.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { db } from './usecaseDb.js';

beforeAll(async () => {
  // Registers the use case diagram so `Diagram.fromText` can resolve it.
  addDiagrams();
  await Diagram.fromText('usecase-beta\n actor TestActor');
});

const colorIndexById = async (text: string) => {
  await Diagram.fromText(text);
  return new Map(db.getData().nodes.map((node) => [node.id, node.colorIndex]));
};

describe('usecase diagram colour slots', () => {
  it('gives actors and use cases slots from one shared cycle', async () => {
    const slots = await colorIndexById(`usecase-beta
actor User
actor Admin
Login("Sign in")
Logout("Sign out")`);

    // One counter across kinds: no two elements share a colour until the palette wraps.
    expect(slots.get('User')).toBe(0);
    expect(slots.get('Admin')).toBe(1);
    expect(slots.get('Login')).toBe(2);
    expect(slots.get('Logout')).toBe(3);
  });

  it('numbers the actors before the use cases, whatever order they were written in', async () => {
    const slots = await colorIndexById(`usecase-beta
actor A
Middle("A use case between the two actors")
actor B`);

    // The two kinds live in separate maps, so the shared cycle runs over the actors first
    // and the use cases after them rather than over the source order -- interleaving them
    // would need the declaration index carried through the model. Written down because the
    // grouping is the contract `usecase.colorScheme: 'rotate'` documents, and a future
    // change that merged the two loops would silently recolour every interleaved diagram.
    expect(slots.get('A')).toBe(0);
    expect(slots.get('B')).toBe(1);
    expect(slots.get('Middle')).toBe(2);
  });

  it('numbers system boundaries from zero, on their own counter', async () => {
    const slots = await colorIndexById(`usecase-beta
systemBoundary sb1["Payment service"]
  actor Clerk
  Authorize("Authorize payment")
end
systemBoundary sb2["Shipping"]
  Dispatch("Dispatch order")
end
Receipt("Create receipt")`);

    // Boundaries run on their own counter, the way `flowDb` numbers flowchart subgraphs:
    // slot N means "the Nth group", which has to hold whatever else the diagram contains.
    // Sharing the actor/use case cycle would make the first boundary's colour depend on how
    // many actors happened to be declared, which is exactly the instability the counter is
    // supposed to avoid here.
    expect(slots.get('sb1')).toBe(0);
    expect(slots.get('sb2')).toBe(1);

    // ...and the actors and use cases keep their own shared cycle, undisturbed by them.
    expect(slots.get('Clerk')).toBe(0);
    expect(slots.get('Authorize')).toBe(1);
    expect(slots.get('Dispatch')).toBe(2);
    expect(slots.get('Receipt')).toBe(3);
  });

  it('keeps boundary slots stable when an actor is inserted before them', async () => {
    const withExtraActor = await colorIndexById(`usecase-beta
actor Extra
systemBoundary sb1["Payment service"]
  actor Clerk
end
systemBoundary sb2["Shipping"]
  Dispatch("Dispatch order")
end`);

    // The point of the separate counter: adding an actor must not recolour the groups.
    expect(withExtraActor.get('sb1')).toBe(0);
    expect(withExtraActor.get('sb2')).toBe(1);
  });

  it('does not spend a slot on a note', async () => {
    const slots = await colorIndexById(`usecase-beta
actor User
note for User "Starts the workflow"
Login("Sign in")`);

    const noteEntry = [...slots.entries()].find(([id]) => id.startsWith('note'));
    // A note carries the theme's fixed note colour, so it stays outside the cycle.
    expect(noteEntry).toBeDefined();
    expect(noteEntry?.[1]).toBeUndefined();
    expect(slots.get('User')).toBe(0);
    expect(slots.get('Login')).toBe(1);
  });

  it('does not spend a slot on a JSON table', async () => {
    const slots = await colorIndexById(`usecase-beta
actor User
json Payload@{ "active": true }
Login("Sign in")`);

    // Same reasoning as a note: a JSON table is reference data, not a participant.
    expect(slots.has('Payload')).toBe(true);
    expect(slots.get('Payload')).toBeUndefined();
    expect(slots.get('User')).toBe(0);
    expect(slots.get('Login')).toBe(1);
  });
});
