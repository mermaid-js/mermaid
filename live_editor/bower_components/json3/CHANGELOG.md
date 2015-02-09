# JSON3 Changelog

## 3.1.0

 * Switched to `bestiejs` organisation
 * Added support for a list of properties as the `filter` argument for `JSON.stringify`
 * Fixed Firefox 4 and 4.0.1 allowing non-standard extensions to `JSON.parse`

## 3.0.0

 * Renamed `JSON3` to `JSON`
 * Removed `JSON3.Version`
 * Added minified version of library
 * Created a [GitHub Project Page](http://bestiejs.github.io/json3)
 * Preserved alphanumeric order when iterating over shadowed properties on objects

## 0.8.5

 * Avoided relying on native functions `Math.abs`, and `isFinite`, and native constructors `String`, `Number`, `Object`, and `Array`
 * Fixed AMD export logic

## 0.8.0

 * Renamed `Prim` to `JSON3`
 * Added `JSON3.Version`
 * Added support for AMD lodaers as the `"json"` module
 * Added feature tests for native `JSON` implementations
 * Added string coercion for the `source` argument in `JSON3.parse`
 * Fixed the date serialization routine in `JSON3.stringify`

## 0.5.0

 * Fixed `Prim.stringify`'s handling of the `width` argument
 * Added Microsoft's ES5 Conformance Tests to the test suite

## 0.2.0

 * Added `Prim.stringify` for serializing values
 * Renamed `Prim.Escapes` to `Prim.Unescapes`
 * Disallowed unescaped tab characters in strings passed to `Prim.parse`

## 0.1.0

 * Initial release of Prim
