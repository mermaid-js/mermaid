import svgDraw from './svgDraw';

describe('class member Renderer, ', function () {
  describe('when parsing text to build method display string', function () {
    it('should handle simple method declaration', function () {
      const str = 'foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle public visibility', function () {
      const str = '+foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('+foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle private visibility', function () {
      const str = '-foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('-foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle protected visibility', function () {
      const str = '#foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('#foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle package/internal visibility', function () {
      const str = '~foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('~foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should ignore unknown character for visibility', function () {
      const str = '!foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle abstract method classifier', function () {
      const str = 'foo()*';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo()');
      expect(actual.cssStyle).toBe('font-style:italic;');
    });

    it('should handle abstract method classifier with return type', function () {
      const str = 'foo(name: String) int*';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(name: String) : int');
      expect(actual.cssStyle).toBe('font-style:italic;');
    });

    it('should handle static method classifier', function () {
      const str = 'foo()$';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo()');
      expect(actual.cssStyle).toBe('text-decoration:underline;');
    });

    it('should handle static method classifier with return type', function () {
      const str = 'foo(name: String) int$';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(name: String) : int');
      expect(actual.cssStyle).toBe('text-decoration:underline;');
    });

    it('should ignore unknown character for classifier', function () {
      const str = 'foo()!';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle simple method declaration with parameters', function () {
      const str = 'foo(int id)';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(int id)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle simple method declaration with multiple parameters', function () {
      const str = 'foo(int id, object thing)';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(int id, object thing)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle simple method declaration with single item in parameters', function () {
      const str = 'foo(id)';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(id)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle simple method declaration with single item in parameters with extra spaces', function () {
      const str = ' foo ( id) ';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(id)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle method declaration with return value', function () {
      const str = 'foo(id) int';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(id) : int');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle method declaration with generic return value', function () {
      const str = 'foo(id) List~int~';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(id) : List<int>');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle method declaration with generic parameter', function () {
      const str = 'foo(List~int~)';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(List<int>)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle method declaration with all possible markup', function () {
      const str = '+foo (  List~int~ ids  )* List~Item~';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('+foo(List<int> ids) : List<Item>');
      expect(actual.cssStyle).toBe('font-style:italic;');
    });

    it('should handle method declaration with nested markup', function () {
      const str = '+foo (  List~List~int~~ ids  )* List~List~Item~~';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('+foo(List<List<int>> ids) : List<List<Item>>');
      expect(actual.cssStyle).toBe('font-style:italic;');
    });
  });

  describe('when parsing text to build field display string', function () {
    it('should handle simple field declaration', function () {
      const str = 'int[] ids';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('int[] ids');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle field declaration with generic type', function () {
      const str = 'List~int~ ids';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('List<int> ids');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle field declaration with generic type (name first)', function () {
      const str = 'ids: List~List~int~~';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('ids: List<List<int>>');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle static field classifier', function () {
      const str = 'String foo$';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('String foo');
      expect(actual.cssStyle).toBe('text-decoration:underline;');
    });

    it('should handle static field classifier (name first)', function () {
      const str = 'foo: String$';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo: String');
      expect(actual.cssStyle).toBe('text-decoration:underline;');
    });

    it('should handle static field classifier (name first, generics)', function () {
      const str = 'foo: List~String~$';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo: List<String>');
      expect(actual.cssStyle).toBe('text-decoration:underline;');
    });
  });
});
