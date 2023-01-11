# Development

```
yarn install
yarn start
```

# 代码结构

DSL 解析器和渲染器都在这个代码库中。

DSL 解析器是基于 Antlr4 构建的。其定义文件位于`src/g4`。生成的解析器位于 `src/generated-parser`。
对解析器的增强相关的代码位于`src/parser`文件夹。

所有其他的文件基本上都是跟渲染器相关的。渲染器是基于 VueJs 2.x 开发的。
