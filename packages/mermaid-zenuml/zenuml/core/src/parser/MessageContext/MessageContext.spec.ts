import { describe, expect, it } from 'vitest';
import { AsyncMessageContextFixture } from '../ContextsFixture';

describe('Messages', () => {
  it('Async Message', () => {
    const message = AsyncMessageContextFixture('Alice -> Bob: Hello World');
    expect(message.getFormattedText()).toBe('Alice -> Bob: Hello World');
  });

  it('Async Message with Comment', () => {
    const message = AsyncMessageContextFixture('// comment \nAlice -> Bob: Hello World');
    expect(message.getFormattedText()).toBe('Alice -> Bob: Hello World');
    expect(message.getComment()).toBe(' comment \n');
  });

  it('Async Message with multiline Comment', () => {
    const message = AsyncMessageContextFixture(
      '// comment1 \n// comment2 \nAlice -> Bob: Hello World'
    );
    expect(message.getFormattedText()).toBe('Alice -> Bob: Hello World');
    expect(message.getComment()).toBe(' comment1 \n comment2 \n');
  });
});
