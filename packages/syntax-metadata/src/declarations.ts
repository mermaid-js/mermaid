import type { DiagramDeclaration } from './types.js';

const declaration = (
  diagramId: string,
  label: string,
  insertText: string,
  documentation?: string
): DiagramDeclaration => ({ diagramId, documentation, insertText, label });

export const declarations: readonly DiagramDeclaration[] = [
  declaration(
    'flowchart',
    'flowchart',
    'flowchart ${1|TD,TB,BT,RL,LR|}\n\t${2:A[Start]} --> ${3:B[End]}\n$0',
    'Flowchart of nodes and edges.'
  ),
  declaration(
    'flowchart',
    'graph',
    'graph ${1|TD,TB,BT,RL,LR|}\n\t${2:A[Start]} --> ${3:B[End]}\n$0'
  ),
  declaration(
    'sequenceDiagram',
    'sequenceDiagram',
    'sequenceDiagram\n\tparticipant ${1:A} as ${2:Alice}\n\tparticipant ${3:B} as ${4:Bob}\n\t${1:A}->>${3:B}: ${5:Hello}\n\t${3:B}-->>${1:A}: ${6:Hi}\n$0'
  ),
  declaration(
    'classDiagram',
    'classDiagram',
    'classDiagram\n\tclass ${1:Animal}\n\t${2:Dog} --|> ${1:Animal}\n$0'
  ),
  declaration(
    'classDiagram',
    'classDiagram-v2',
    'classDiagram-v2\n\tclass ${1:Animal}\n\t${2:Dog} --|> ${1:Animal}\n$0'
  ),
  declaration(
    'stateDiagram',
    'stateDiagram-v2',
    'stateDiagram-v2\n\t[*] --> ${1:Still}\n\t${1:Still} --> ${2:Moving}\n\t${2:Moving} --> [*]\n$0'
  ),
  declaration('stateDiagram', 'stateDiagram', 'stateDiagram\n\t[*] --> ${1:State}\n$0'),
  declaration(
    'erDiagram',
    'erDiagram',
    'erDiagram\n\t${1:CUSTOMER} ||--o{ ${2:ORDER} : ${3:places}\n$0'
  ),
  declaration(
    'gantt',
    'gantt',
    'gantt\n\ttitle ${1:Project}\n\tdateFormat YYYY-MM-DD\n\tsection ${2:Phase}\n\t${3:Task} :${4:task1}, ${5:2024-01-01}, ${6:30d}\n$0'
  ),
  declaration('pie', 'pie', 'pie\n\ttitle ${1:Title}\n\t"${2:Label}" : ${3:42}\n$0'),
  declaration(
    'gitGraph',
    'gitGraph',
    'gitGraph\n\tcommit id: "${1:init}"\n\tbranch ${2:develop}\n\tcommit id: "${3:first}"\n\tcheckout main\n\tmerge ${2:develop}\n$0'
  ),
  declaration(
    'journey',
    'journey',
    'journey\n\ttitle ${1:My day}\n\tsection ${2:Morning}\n\t${3:Make tea}: ${4:5}: ${5:Me}\n$0'
  ),
  declaration(
    'requirementDiagram',
    'requirementDiagram',
    'requirementDiagram\n\trequirement ${1:req1} {\n\t\tid: ${2:1}\n\t\ttext: ${3:description}\n\t\trisk: ${4:low}\n\t\tverifymethod: ${5:test}\n\t}\n$0'
  ),
  declaration(
    'c4Diagram',
    'C4Context',
    'C4Context\n\tPerson(${1:user}, "${2:User}")\n\tSystem(${3:system}, "${4:System}")\n\tRel(${1:user}, ${3:system}, "${5:Uses}")\n$0'
  ),
  declaration(
    'c4Diagram',
    'C4Container',
    'C4Container\n\tPerson(${1:user}, "${2:User}")\n\tContainer(${3:web}, "${4:Web App}", "${5:HTTPS}")\n\tRel(${1:user}, ${3:web}, "${6:Uses}")\n$0'
  ),
  declaration(
    'c4Diagram',
    'C4Component',
    'C4Component\n\tContainer_Boundary(${1:api}, "${2:API}") {\n\t\tComponent(${3:auth}, "${4:Auth}", "${5:JWT}")\n\t}\n$0'
  ),
  declaration(
    'c4Diagram',
    'C4Dynamic',
    'C4Dynamic\n\tPerson(${1:user}, "${2:User}")\n\tSystem(${3:system}, "${4:System}")\n\tRel(${1:user}, ${3:system}, "${5:Makes a request}")\n$0'
  ),
  declaration(
    'c4Diagram',
    'C4Deployment',
    'C4Deployment\n\tDeployment_Node(${1:node}, "${2:Server}", "${3:Ubuntu}") {\n\t\tContainer(${3:app}, "${4:App}", "${5:Node.js}")\n\t}\n$0'
  ),
  declaration(
    'mindmap',
    'mindmap',
    'mindmap\n\troot((${1:Root}))\n\t\t${2:Child}\n\t\t${3:Child}\n$0'
  ),
  declaration(
    'timeline',
    'timeline',
    'timeline\n\ttitle ${1:History}\n\t${2:2024} : ${3:Event}\n$0'
  ),
  declaration(
    'quadrantChart',
    'quadrantChart',
    'quadrantChart\n\ttitle ${1:Title}\n\tx-axis ${2:Low} --> ${3:High}\n\ty-axis ${4:Low} --> ${5:High}\n\tquadrant-1 ${6:Q1}\n\tquadrant-2 ${7:Q2}\n\tquadrant-3 ${8:Q3}\n\tquadrant-4 ${9:Q4}\n\t${10:Point}: [${11:0.5}, ${12:0.5}]\n$0'
  ),
  declaration(
    'xychart',
    'xychart-beta',
    'xychart-beta\n\ttitle "${1:Title}"\n\tx-axis [${2:a, b, c}]\n\ty-axis ${3:0} --> ${4:100}\n\tbar [${5:1, 2, 3}]\n$0'
  ),
  declaration('sankey', 'sankey-beta', 'sankey-beta\n\n${1:Source},${2:Target},${3:10}\n$0'),
  declaration('info', 'info', 'info\n$0'),
  declaration('kanban', 'kanban', 'kanban\n\t${1:Todo}\n\t\t${2:[Task]}\n$0'),
  declaration(
    'packet',
    'packet-beta',
    'packet-beta\n\ttitle ${1:Title}\n\t0-15: "${2:Source Port}"\n\t16-31: "${3:Destination Port}"\n$0'
  ),
  declaration(
    'architecture',
    'architecture-beta',
    'architecture-beta\n\tgroup ${1:api}(cloud)[${2:API}]\n\tservice ${3:db}(database)[${4:DB}] in ${1:api}\n$0'
  ),
  declaration('block', 'block-beta', 'block-beta\n\tcolumns ${1:3}\n\t${2:A} ${3:B} ${4:C}\n$0'),
  declaration(
    'treemap',
    'treemap-beta',
    'treemap-beta\n\t"${1:Section}"\n\t\t"${2:Leaf}": ${3:10}\n$0'
  ),
  declaration(
    'radar',
    'radar-beta',
    'radar-beta\n\taxis ${1:a}, ${2:b}, ${3:c}\n\tcurve ${4:curve1}{${5:1}, ${6:2}, ${7:3}}\n$0'
  ),
  declaration('zenuml', 'zenuml', 'zenuml\n\t${1:Alice} -> ${2:Bob}: ${3:Hello}\n$0'),
];
