import svgDraw from './svgDraw.js';

describe('given a string representing class method, ', function () {
  it('should handle class names with generics', function () {
    const classDef = {
      id: 'Car',
      type: 'T',
      label: 'Car',
    };

    let actual = svgDraw.getClassTitleString(classDef);
    expect(actual).toBe('Car<T>');
  });

  describe('when parsing base method declaration', function () {
    it('should handle simple declaration', function () {
      const str = 'foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle declaration with parameters', function () {
      const str = 'foo(int id)';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(int id)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle declaration with multiple parameters', function () {
      const str = 'foo(int id, object thing)';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(int id, object thing)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle declaration with single item in parameters', function () {
      const str = 'foo(id)';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(id)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle declaration with single item in parameters with extra spaces', function () {
      const str = ' foo ( id) ';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(id)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle method declaration with generic parameter', function () {
      const str = 'foo(List~int~)';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(List<int>)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle method declaration with normal and generic parameter', function () {
      const str = 'foo(int, List~int~)';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(int, List<int>)');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle declaration with return value', function () {
      const str = 'foo(id) int';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(id) : int');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle declaration with colon return value', function () {
      const str = 'foo(id) : int';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(id) : int');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle declaration with generic return value', function () {
      const str = 'foo(id) List~int~';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(id) : List<int>');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle declaration with colon generic return value', function () {
      const str = 'foo(id) : List~int~';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(id) : List<int>');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle method declaration with all possible markup', function () {
      const str = '+foo (  List~int~ ids  )* List~Item~';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('+foo(List<int> ids) : List<Item>');
      expect(actual.cssStyle).toBe('font-style:italic;');
    });

    it('should handle method declaration with nested generics', function () {
      const str = '+foo (  List~List~int~~ ids  )* List~List~Item~~';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('+foo(List<List<int>> ids) : List<List<Item>>');
      expect(actual.cssStyle).toBe('font-style:italic;');
    });
  });

  describe('when parsing method visibility', function () {
    it('should correctly handle public', function () {
      const str = '+foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('+foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should correctly handle private', function () {
      const str = '-foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('-foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should correctly handle protected', function () {
      const str = '#foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('#foo()');
      expect(actual.cssStyle).toBe('');
    });

    it('should correctly handle package/internal', function () {
      const str = '~foo()';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('~foo()');
      expect(actual.cssStyle).toBe('');
    });
  });

  describe('when parsing method classifier', function () {
    it('should handle abstract method', function () {
      const str = 'foo()*';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo()');
      expect(actual.cssStyle).toBe('font-style:italic;');
    });

    it('should handle abstract method with return type', function () {
      const str = 'foo(name: String) int*';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(name: String) : int');
      expect(actual.cssStyle).toBe('font-style:italic;');
    });

    it('should handle abstract method classifier after parenthesis with return type', function () {
      const str = 'foo(name: String)* int';
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

    it('should handle static method classifier with colon and return type', function () {
      const str = 'foo(name: String): int$';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo(name: String) : int');
      expect(actual.cssStyle).toBe('text-decoration:underline;');
    });

    it('should handle static method classifier after parenthesis with return type', function () {
      const str = 'foo(name: String)$ int';
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
  });
});

describe('given a string representing class member, ', function () {
  describe('when parsing member declaration', function () {
    it('should handle simple field', function () {
      const str = 'id';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('id');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle field with type', function () {
      const str = 'int id';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('int id');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle field with type (name first)', function () {
      const str = 'id: int';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('id: int');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle array field', function () {
      const str = 'int[] ids';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('int[] ids');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle array field (name first)', function () {
      const str = 'ids: int[]';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('ids: int[]');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle field with generic type', function () {
      const str = 'List~int~ ids';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('List<int> ids');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle field with generic type (name first)', function () {
      const str = 'ids: List~int~';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('ids: List<int>');
      expect(actual.cssStyle).toBe('');
    });
  });

  describe('when parsing classifiers', function () {
    it('should handle static field', function () {
      const str = 'String foo$';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('String foo');
      expect(actual.cssStyle).toBe('text-decoration:underline;');
    });

    it('should handle static field (name first)', function () {
      const str = 'foo: String$';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo: String');
      expect(actual.cssStyle).toBe('text-decoration:underline;');
    });

    it('should handle static field with generic type', function () {
      const str = 'List~String~ foo$';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('List<String> foo');
      expect(actual.cssStyle).toBe('text-decoration:underline;');
    });

    it('should handle static field with generic type (name first)', function () {
      const str = 'foo: List~String~$';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('foo: List<String>');
      expect(actual.cssStyle).toBe('text-decoration:underline;');
    });

    it('should handle field with nested generic type', function () {
      const str = 'List~List~int~~ idLists';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('List<List<int>> idLists');
      expect(actual.cssStyle).toBe('');
    });

    it('should handle field with nested generic type (name first)', function () {
      const str = 'idLists: List~List~int~~';
      let actual = svgDraw.parseMember(str);

      expect(actual.displayText).toBe('idLists: List<List<int>>');
      expect(actual.cssStyle).toBe('');
    });
  });
});
