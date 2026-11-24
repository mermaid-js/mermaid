/**
 * Regression tests for actor-menu keyword names (`link`, `links`, `properties`,
 * `details`) used as participant ids. The keywords are only lexed as statement
 * starters when an actor follows them, so references like `A->>Link: hello`
 * fall through to the ACTOR rule instead of colliding with the directive.
 */
import { describe, expect, it } from 'vitest';
import { jsdomIt } from '../../tests/util.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/sequenceDiagram.jison';
import { SequenceDB } from './sequenceDb.js';

const parse = (text: string): SequenceDB => {
  const db = new SequenceDB();
  parser.yy = db;
  parser.parse(text);
  return db;
};

const messagesOf = (text: string) => parse(text).getMessages();

describe('actor-menu keywords as participant ids', () => {
  it('accepts Link as a message recipient (the reported case)', () => {
    const db = parse(`sequenceDiagram
    participant A
    participant Link as Channel
    A->>Link: message`);

    expect([...db.getActors().keys()]).toEqual(['A', 'Link']);
    expect(db.getMessages()).toHaveLength(1);
    expect(db.getMessages()[0]).toMatchObject({ from: 'A', to: 'Link' });
  });

  it('accepts Link as a message sender', () => {
    const messages = messagesOf(`sequenceDiagram
    participant A
    participant Link as Channel
    Link->>A: message`);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ from: 'Link', to: 'A' });
  });

  it('accepts Link as a sender with spaces around the arrow', () => {
    const messages = messagesOf(`sequenceDiagram
    participant A
    participant Link as Channel
    Link  -->>A: message`);

    expect(messages[0]).toMatchObject({ from: 'Link', to: 'A' });
  });

  it('accepts Link as a recipient with a space before the colon', () => {
    const messages = messagesOf(`sequenceDiagram
    participant A
    participant Link as Channel
    A->>Link : message`);

    expect(messages[0]).toMatchObject({ from: 'A', to: 'Link' });
  });

  it.each(['Links', 'Properties', 'Details'])('accepts %s as a recipient', (name) => {
    const messages = messagesOf(`sequenceDiagram
    participant A
    participant ${name} as Alias
    A->>${name}: message`);

    expect(messages[0]).toMatchObject({ from: 'A', to: name });
  });

  it('keeps the original spelling of the participant id', () => {
    const db = parse(`sequenceDiagram
    participant A
    participant LINK as Channel
    A->>LINK: message`);

    expect(db.getActors().get('LINK')).toBeDefined();
    expect(db.getMessages()[0]).toMatchObject({ from: 'A', to: 'LINK' });
  });

  it('does not treat the word link inside a message as a directive', () => {
    const messages = messagesOf(`sequenceDiagram
    participant A
    participant B
    A->>B: see the link page`);

    expect(messages[0]?.message).toBe('see the link page');
  });
});

describe('actor-menu statements still parse', () => {
  it('parses a link statement', () => {
    const db = parse(`sequenceDiagram
    participant A
    link A: Help @ https://example.com`);

    expect(db.getActor('A').links).toEqual({ Help: 'https://example.com' });
  });

  it('parses a link statement with a space before the colon', () => {
    const db = parse(`sequenceDiagram
    participant A
    link A : Help @ https://example.com`);

    expect(db.getActor('A').links).toEqual({ Help: 'https://example.com' });
  });

  it('parses a links statement', () => {
    const db = parse(`sequenceDiagram
    participant A
    links A: {"help": "https://example.com"}`);

    expect(db.getActor('A').links).toEqual({ help: 'https://example.com' });
  });

  it('parses a properties statement', () => {
    const db = parse(`sequenceDiagram
    participant A
    properties A: {"color": "red"}`);

    expect(db.getActor('A').properties).toEqual({ color: 'red' });
  });

  jsdomIt('parses a details statement', ({ body }) => {
    body
      .append('script')
      .attr('type', 'application/json')
      .attr('id', 'details-1')
      .text('{"properties": {"color": "red"}}');

    const db = parse(`sequenceDiagram
    participant A
    details A: details-1`);

    expect(db.getActor('A').properties).toEqual({ color: 'red' });
  });
});
