Error when running 'yarn build'

```shell
 ERROR  Failed to compile with 1 error                                                                                                                                                                                       10:15:37 AM

 error  in ./src/components/theme-blue-river.scss

Syntax Error: ModuleError: Module Error (from ./node_modules/sass-loader/dist/cjs.js):
Missing binding /Users/pengxiao/workspaces/zenuml/vue-sequence/node_modules/node-sass/vendor/darwin-x64-83/binding.node
Node Sass could not find a binding for your current environment: OS X 64-bit with Node.js 14.x
```

Remove 'node_modules' and re-run 'yarn build' under node 14.
