import { describe, expect, test } from 'vitest';
import Comment from '../Comment/Comment';

describe('Comment', function () {
  test.each([
    ['[red] comment \n', ' comment', 'red'],
    ['[red] comment \n multiple-line\n', ' comment \n multiple-line', 'red'],
    ['comment \n', 'comment', undefined],
    ['[red] \n', '', 'red'],
  ])('parse %s as text %s and color %s', function (raw, text, color) {
    const comment = new Comment(raw);
    expect(comment.color).toBe(color);
    expect(comment.text).toBe(text);
  });
});
