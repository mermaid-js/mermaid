<p align="center">
<img src="https://raw.githubusercontent.com/mermaid-js/mermaid/develop/docs/public/favicon.svg" height="150">
</p>
<h1 align="center">
Mermaid
</h1>
<p align="center">
通过解析类 Markdown 的文本语法来实现图表的创建和动态修改。
<p>
<p align="center">
  <a href="https://www.npmjs.com/package/mermaid"><img src="https://img.shields.io/npm/v/mermaid?color=ff3670&label="></a>
<p>

<p align="center">
<a href="https://mermaid.live/"><b>实时编辑器!</b></a>
</p>
<p align="center">
 <a href="https://mermaid.js.org">📖 文档</a> | <a href="https://mermaid.js.org/intro/">🚀 入门</a> | <a href="https://www.jsdelivr.com/package/npm/mermaid">🌐 CDN</a> | <a href="https://discord.gg/AgrbSrBer3" title="Discord invite">🙌 加入我们</a>
</p>
<p align="center">
<a href="./README.md">English</a>
</p>

<p align="center">
尝试未来版本的实时编辑器预览: <a href="https://develop.git.mermaid.live/" title="尝试来自develop分支的mermaid版本。">Develop</a> | <a href="https://next.git.mermaid.live/" title="尝试来自next分支的mermaid版本。">Next</a>
</p>

<br>
<br>

[![NPM](https://img.shields.io/npm/v/mermaid)](https://www.npmjs.com/package/mermaid)
[![Build CI Status](https://github.com/mermaid-js/mermaid/actions/workflows/build.yml/badge.svg)](https://github.com/mermaid-js/mermaid/actions/workflows/build.yml)
[![npm minified gzipped bundle size](https://img.shields.io/bundlephobia/minzip/mermaid)](https://bundlephobia.com/package/mermaid)
[![Coverage Status](https://codecov.io/github/mermaid-js/mermaid/branch/develop/graph/badge.svg)](https://app.codecov.io/github/mermaid-js/mermaid/tree/develop)
[![CDN Status](https://img.shields.io/jsdelivr/npm/hm/mermaid)](https://www.jsdelivr.com/package/npm/mermaid)
[![NPM Downloads](https://img.shields.io/npm/dm/mermaid)](https://www.npmjs.com/package/mermaid)
[![Join our Discord!](https://img.shields.io/static/v1?message=join%20chat&color=9cf&logo=discord&label=discord)](https://discord.gg/AgrbSrBer3)
[![Twitter Follow](https://img.shields.io/badge/Social-mermaidjs__-blue?style=social&logo=X)](https://twitter.com/mermaidjs_)

<img src="./img/header.png" alt="" />

:trophy: **Mermaid 被提名并获得了 [JS Open Source Awards (2019)](https://osawards.com/javascript/2019) 的 "The most exciting use of technology" 奖项!!!**

**感谢所有参与进来提交 PR，解答疑问的人们! 🙏**

<a href="https://mermaid.js.org/landing/"><img src="https://github.com/mermaid-js/mermaid/blob/master/docs/intro/img/book-banner-post-release.jpg" alt="Explore Mermaid.js in depth, with real-world examples, tips & tricks from the creator... The first official book on Mermaid is available for purchase. Check it out!"></a>

## 关于 Mermaid

<!-- <Main description>   -->

Mermaid 是一个基于 Javascript 的图表绘制工具，通过解析类 Markdown 的文本语法来实现图表的创建和动态修改。Mermaid 诞生的主要目的是让文档的更新能够及时跟上开发进度。

> Doc-Rot 是 Mermaid 致力于解决的一个难题。

绘图和编写文档花费了开发者宝贵的开发时间，而且随着业务的变更，它很快就会过期。 但是如果缺少了图表或文档，对于生产力和团队新人的业务学习都会产生巨大的阻碍。 <br/>
Mermaid 通过允许用户创建便于修改的图表来解决这一难题，它也可以作为生产脚本（或其他代码）的一部分。<br/>
<br/>
Mermaid 甚至能让非程序员也能通过 [Mermaid Live Editor](https://mermaid.live/) 轻松创建详细的图表。<br/>
你可以访问 [教程](https://mermaid.js.org/ecosystem/tutorials.html) 来查看 Live Editor 的视频教程，也可以查看 [Mermaid 的集成和使用](https://mermaid.js.org/ecosystem/integrations-community.html) 这个清单来检查你的文档工具是否已经集成了 Mermaid 支持。

如果想要查看关于 Mermaid 更详细的介绍及基础使用方式，可以查看 [入门指引](https://mermaid.js.org/intro/getting-started.html), [用法](https://mermaid.js.org/config/usage.html) 和 [教程](https://mermaid.js.org/ecosystem/tutorials.html).

<!-- </Main description> -->

## 示例

**下面是一些可以使用 Mermaid 创建的图表示例。点击 [语法](https://mermaid.js.org/intro/syntax-reference.html) 查看详情。**

<table>
<!-- <Flowchart> -->

### 流程图 [<a href="https://mermaid.js.org/syntax/flowchart.html">文档</a> - <a href="https://mermaid.live/edit#base64:eyJjb2RlIjoiZ3JhcGggVERcbiAgICBBW0hhcmRdIC0tPnxUZXh0fCBCKFJvdW5kKVxuICAgIEIgLS0-IEN7RGVjaXNpb259XG4gICAgQyAtLT58T25lfCBEW1Jlc3VsdCAxXVxuICAgIEMgLS0-fFR3b3wgRVtSZXN1bHQgMl0iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ">live editor</a>]

```
flowchart LR
A[Hard] -->|Text| B(Round)
B --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]
```

```mermaid
flowchart LR
A[Hard] -->|Text| B(Round)
B --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]
```

### 时序图 [<a href="https://mermaid.js.org/syntax/sequenceDiagram.html">文档</a> - <a href="https://mermaid.live/edit#base64:eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG5BbGljZS0-PkpvaG46IEhlbGxvIEpvaG4sIGhvdyBhcmUgeW91P1xubG9vcCBIZWFsdGhjaGVja1xuICAgIEpvaG4tPj5Kb2huOiBGaWdodCBhZ2FpbnN0IGh5cG9jaG9uZHJpYVxuZW5kXG5Ob3RlIHJpZ2h0IG9mIEpvaG46IFJhdGlvbmFsIHRob3VnaHRzIVxuSm9obi0tPj5BbGljZTogR3JlYXQhXG5Kb2huLT4-Qm9iOiBIb3cgYWJvdXQgeW91P1xuQm9iLS0-PkpvaG46IEpvbGx5IGdvb2QhIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0">live editor</a>]

```
sequenceDiagram
Alice->>John: Hello John, how are you?
loop HealthCheck
    John->>John: Fight against hypochondria
end
Note right of John: Rational thoughts!
John-->>Alice: Great!
John->>Bob: How about you?
Bob-->>John: Jolly good!
```

```mermaid
sequenceDiagram
Alice->>John: Hello John, how are you?
loop HealthCheck
    John->>John: Fight against hypochondria
end
Note right of John: Rational thoughts!
John-->>Alice: Great!
John->>Bob: How about you?
Bob-->>John: Jolly good!
```

### 甘特图 [<a href="https://mermaid.js.org/syntax/gantt.html">文档</a> - <a href="https://mermaid.live/edit#base64:eyJjb2RlIjoiZ2FudHRcbnNlY3Rpb24gU2VjdGlvblxuQ29tcGxldGVkIDpkb25lLCAgICBkZXMxLCAyMDE0LTAxLTA2LDIwMTQtMDEtMDhcbkFjdGl2ZSAgICAgICAgOmFjdGl2ZSwgIGRlczIsIDIwMTQtMDEtMDcsIDNkXG5QYXJhbGxlbCAxICAgOiAgICAgICAgIGRlczMsIGFmdGVyIGRlczEsIDFkXG5QYXJhbGxlbCAyICAgOiAgICAgICAgIGRlczQsIGFmdGVyIGRlczEsIDFkXG5QYXJhbGxlbCAzICAgOiAgICAgICAgIGRlczUsIGFmdGVyIGRlczMsIDFkXG5QYXJhbGxlbCA0ICAgOiAgICAgICAgIGRlczYsIGFmdGVyIGRlczQsIDFkIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0">live editor</a>]

```
gantt
    section Section
    Completed :done,    des1, 2014-01-06,2014-01-08
    Active        :active,  des2, 2014-01-07, 3d
    Parallel 1   :         des3, after des1, 1d
    Parallel 2   :         des4, after des1, 1d
    Parallel 3   :         des5, after des3, 1d
    Parallel 4   :         des6, after des4, 1d
```

```mermaid
gantt
    section Section
    Completed :done,    des1, 2014-01-06,2014-01-08
    Active        :active,  des2, 2014-01-07, 3d
    Parallel 1   :         des3, after des1, 1d
    Parallel 2   :         des4, after des1, 1d
    Parallel 3   :         des5, after des3, 1d
    Parallel 4   :         des6, after des4, 1d
```

### 类图 [<a href="https://mermaid.js.org/syntax/classDiagram.html">文档</a> - <a href="https://mermaid.live/edit#base64:eyJjb2RlIjoiY2xhc3NEaWFncmFtXG5DbGFzczAxIDx8LS0gQXZlcnlMb25nQ2xhc3MgOiBDb29sXG48PGludGVyZmFjZT4-IENsYXNzMDFcbkNsYXNzMDkgLS0-IEMyIDogV2hlcmUgYW0gaT9cbkNsYXNzMDkgLS0qIEMzXG5DbGFzczA5IC0tfD4gQ2xhc3MwN1xuQ2xhc3MwNyA6IGVxdWFscygpXG5DbGFzczA3IDogT2JqZWN0W10gZWxlbWVudERhdGFcbkNsYXNzMDEgOiBzaXplKClcbkNsYXNzMDEgOiBpbnQgY2hpbXBcbkNsYXNzMDEgOiBpbnQgZ29yaWxsYVxuY2xhc3MgQ2xhc3MxMCB7XG4gID4-c2VydmljZT4-XG4gIGludCBpZFxuICBzaXplKClcbn0iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ">live editor</a>]

```
classDiagram
Class01 <|-- AveryLongClass : Cool
<<Interface>> Class01
Class09 --> C2 : Where am I?
Class09 --* C3
Class09 --|> Class07
Class07 : equals()
Class07 : Object[] elementData
Class01 : size()
Class01 : int chimp
Class01 : int gorilla
class Class10 {
  <<service>>
  int id
  size()
}
```

```mermaid
classDiagram
Class01 <|-- AveryLongClass : Cool
<<Interface>> Class01
Class09 --> C2 : Where am I?
Class09 --* C3
Class09 --|> Class07
Class07 : equals()
Class07 : Object[] elementData
Class01 : size()
Class01 : int chimp
Class01 : int gorilla
class Class10 {
  <<service>>
  int id
  size()
}
```

### 状态图 [<a href="https://mermaid.js.org/syntax/stateDiagram.html">docs</a> - <a href="https://mermaid.live/edit#pako:eNpdkLsOwjAMRX-l8ojahTEDCzB26kgYrMYtkfJAqVMJVf13QiIKqqfr44d8vUDvFYGAiZHponEMaJv5KF2V4na4V01zqjrWxhSUZYapuEetn7UbCy16P_5HzwGnR6FZfpdCDZaCRa3SWcunQQI_yJIEkaSiAaNhCdKtqRUj--7lehAcItUQn-pnBMSAZtroVWn2YYOU07b4z29Y37gJVYk">live editor</a>]

```
stateDiagram-v2
[*] --> Still
Still --> [*]
Still --> Moving
Moving --> Still
Moving --> Crash
Crash --> [*]
```

```mermaid
stateDiagram-v2
[*] --> Still
Still --> [*]
Still --> Moving
Moving --> Still
Moving --> Crash
Crash --> [*]
```

### 饼图 [<a href="https://mermaid.js.org/syntax/pie.html">文档</a> - <a href="https://mermaid.live/edit#base64:eyJjb2RlIjoicGllXG5cIkRvZ3NcIiA6IDQyLjk2XG5cIkNhdHNcIiA6IDUwLjA1XG5cIlJhdHNcIiA6IDEwLjAxIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0">live editor</a>]

```
pie
"Dogs" : 386
"Cats" : 85
"Rats" : 15
```

```mermaid
pie
"Dogs" : 386
"Cats" : 85
"Rats" : 15
```

### Git 图 [实验特性 - <a href="https://mermaid.live/edit#base64:eyJjb2RlIjoiZ2l0R3JhcGg6XG5vcHRpb25zXG57XG4gICAgXCJub2RlU3BhY2luZ1wiOiAxNTAsXG4gICAgXCJub2RlUmFkaXVzXCI6IDEwXG59XG5lbmRcbmNvbW1pdFxuYnJhbmNoIG5ld2JyYW5jaFxuY2hlY2tvdXQgbmV3YnJhbmNoXG5jb21taXRcbmNvbW1pdFxuY2hlY2tvdXQgbWFzdGVyXG5jb21taXRcbmNvbW1pdFxubWVyZ2UgbmV3YnJhbmNoXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ">live editor</a>]

### 用户体验旅程图 [<a href="https://mermaid.js.org/syntax/userJourney.html">文档</a> - <a href="https://mermaid.live/edit#pako:eNpljzEPgkAMhf9K05nFGJdbJXFiYmVpuKIncDVHL4QQ_ruHaILaqXnf63vpjLVYRoMAd4nB81R5SKNOO4ZiglFC6_wVLL3JwLU68XARUHnhTQcoqGVQJgMnAwV_5GSMj0HJhcHAcU_y7d7AYVUzOJP-ddyk3ydZGf0n66uldPqCPxWYYc-hJ2fTj_OqVqg3Tplo0mq5odhphZVfkpWiSjn5Go2GyBnGhyXl3NE1UI-moW7g5QkSoF5m">live editor</a>]

```
  journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 3: Me
```

```mermaid
  journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 3: Me
```

### C4 图 [<a href="https://mermaid.js.org/syntax/c4.html">文档</a>]

```
C4Context
title System Context diagram for Internet Banking System

Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
Person(customerB, "Banking Customer B")
Person_Ext(customerC, "Banking Customer C")
System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")

Enterprise_Boundary(b1, "BankBoundary") {

  SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

  System_Boundary(b2, "BankBoundary2") {
    System(SystemA, "Banking System A")
    System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts.")
  }

  System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
  SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")

  Boundary(b3, "BankBoundary3", "boundary") {
    SystemQueue(SystemF, "Banking System F Queue", "A system of the bank, with personal bank accounts.")
    SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")
  }
}

BiRel(customerA, SystemAA, "Uses")
BiRel(SystemAA, SystemE, "Uses")
Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
Rel(SystemC, customerA, "Sends e-mails to")
```

```mermaid
C4Context
title System Context diagram for Internet Banking System

Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
Person(customerB, "Banking Customer B")
Person_Ext(customerC, "Banking Customer C")
System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")

Enterprise_Boundary(b1, "BankBoundary") {

  SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

  System_Boundary(b2, "BankBoundary2") {
    System(SystemA, "Banking System A")
    System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts.")
  }

  System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
  SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")

  Boundary(b3, "BankBoundary3", "boundary") {
    SystemQueue(SystemF, "Banking System F Queue", "A system of the bank, with personal bank accounts.")
    SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")
  }
}

BiRel(customerA, SystemAA, "Uses")
BiRel(SystemAA, SystemE, "Uses")
Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
Rel(SystemC, customerA, "Sends e-mails to")
```

## 发布

对于有权限的同学来说，你可以通过以下步骤来完成发布操作：

更新 `package.json` 中的版本号，然后执行如下命令：

```sh
npm publish
```

以上的命令会将文件打包到 `dist` 目录并发布至 <https://www.npmjs.com>.

## 相关项目

- [Command Line Interface](https://github.com/mermaid-js/mermaid-cli)
- [Live Editor](https://github.com/mermaid-js/mermaid-live-editor)
- [HTTP Server](https://github.com/TomWright/mermaid-server)

## 贡献者 [![Good first issue](https://img.shields.io/github/labels/mermaid-js/mermaid/Good%20first%20issue%21)](https://github.com/mermaid-js/mermaid/issues?q=is%3Aissue+is%3Aopen+label%3A%22Good+first+issue%21%22) [![Contributors](https://img.shields.io/github/contributors/mermaid-js/mermaid)](https://github.com/mermaid-js/mermaid/graphs/contributors) [![Commits](https://img.shields.io/github/commit-activity/m/mermaid-js/mermaid)](https://github.com/mermaid-js/mermaid/graphs/contributors)

Mermaid 是一个不断发展中的社区，并且还在接收新的贡献者。有很多不同的方式可以参与进来，而且我们还在寻找额外的帮助。如果你想知道如何开始贡献，请查看 [这个 issue](https://github.com/mermaid-js/mermaid/issues/866)。

关于如何贡献的详细信息可以在 [贡献指南](https://mermaid.js.org/community/contributing.html) 中找到。

## 安全

对于公开网站来说，从互联网上的用户处检索文本、存储供后续在浏览器中展示的内容可能是不安全的，理由是用户的内容可能嵌入一些数据加载完成之后就会运行的恶意脚本，这些对于 Mermaid 来说毫无疑问是一个风险，尤其是 mermaid 图表还包含了许多在 html 中使用的字符，这意味着我们难以使用常规的手段来过滤不安全代码，因为这些常规手段会造成图表损坏。我们仍然在努力对获取到的代码进行安全过滤并不断完善我们的程序，但很难保证没有漏洞。

作为拥有外部用户的网站的额外安全级别，我们很高兴推出一个新的安全级别，其中的图表在沙盒 iframe 中渲染，防止代码中的 javascript 被执行，这是在安全性方面迈出的一大步。

_很不幸的是，鱼与熊掌不可兼得，在这个场景下它意味着在可能的恶意代码被阻止时，也会损失部分交互能力_。

## 报告漏洞

如果想要报告漏洞，请发送邮件到 security@mermaid.live, 并附上问题的描述、复现问题的步骤、受影响的版本，以及解决问题的方案（如果有的话）。

## 鸣谢

来自 Knut Sveidqvist:

> _特别感谢 [d3](https://d3js.org/) 和 [dagre-d3](https://github.com/cpettitt/dagre-d3) 这两个优秀的项目，它们提供了图形布局和绘图工具库！_ > _同样感谢 [js-sequence-diagram](https://bramp.github.io/js-sequence-diagrams) 提供了时序图语法的使用。 感谢 Jessica Peter 提供了甘特图渲染的灵感。_ > _感谢 [Tyler Long](https://github.com/tylerlong) 从 2017 年四月开始成为了项目的合作者。_
>
> _感谢越来越多的 [贡献者们](https://github.com/knsv/mermaid/graphs/contributors)，没有你们，就没有这个项目的今天！_

---

_Mermaid 是由 Knut Sveidqvist 创建，它为了更简单的文档编写而生。_
