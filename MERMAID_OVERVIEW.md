# Mermaid: Overview of Main Functionality and Key Components

## What is Mermaid?

Mermaid is a JavaScript-based diagramming and charting tool that uses Markdown-inspired text definitions to create and modify complex diagrams. The main purpose of Mermaid is to help documentation catch up with development by enabling users to create easily modifiable diagrams that can be integrated into production scripts and documentation workflows.

**Core Philosophy**: "Doc-Rot is a Catch-22 that Mermaid helps to solve" - providing a solution to the common problem where diagramming costs precious developer time and gets outdated quickly, but not having diagrams hurts productivity and organizational learning.

## Main Functionality

### 1. **Text-to-Diagram Conversion**

- Converts Markdown-inspired text definitions into SVG diagrams
- Supports over 15+ different diagram types
- Real-time rendering and preview capabilities
- Integration with popular platforms (GitHub, GitLab, etc.)

### 2. **Interactive Diagram Creation**

- Live Editor for interactive diagram creation
- Web integration module for embedding in web pages
- Dynamic rendering and modification capabilities

### 3. **Extensible Architecture**

- Plugin system for custom diagram types
- Configurable themes and styling
- Multiple layout algorithms support
- External diagram definition loading

## Key Components

### Core Architecture

#### 1. **Entry Points & API Layer**

- **`mermaid.ts`**: Main web page integration module, provides the primary interface for users
- **`mermaidAPI.ts`**: Core API containing functions for parsing and rendering diagrams
- **`Diagram.ts`**: Main diagram abstraction class that handles diagram lifecycle

#### 2. **Configuration System**

- **`config.ts`** & **`config.type.ts`**: Centralized configuration management
- **`defaultConfig.ts`**: Default configuration values
- Supports runtime configuration updates and diagram-specific settings

#### 3. **Parser & Detection System**

- **`diagram-api/detectType.ts`**: Automatic diagram type detection from text input
- **`diagram-api/loadDiagram.ts`**: Dynamic loading and registration of diagram parsers
- **`preprocess.ts`**: Text preprocessing and directive handling

### Diagram Types (Located in `/src/diagrams/`)

Mermaid supports a comprehensive set of diagram types, each with its own parser, renderer, and styling:

#### **Core Diagram Types:**

1. **Flowchart** - Flow diagrams with nodes, edges, and decision points
2. **Sequence** - Interaction diagrams between actors over time
3. **Class** - Object-oriented modeling diagrams
4. **State** - State machine and statechart diagrams
5. **Gantt** - Project timeline and scheduling charts
6. **Git** - Git branching and merging visualizations

#### **Specialized Diagram Types:**

7. **Pie** - Data visualization pie charts
8. **User Journey** - User experience journey mapping
9. **C4** - C4 architecture diagrams (Context, Container, Component, Code)
10. **ER (Entity-Relationship)** - Database modeling diagrams
11. **Mindmap** - Hierarchical mind mapping
12. **Architecture** - System architecture diagrams
13. **Block** - Block diagrams
14. **Kanban** - Kanban board visualization
15. **Packet** - Network packet diagrams
16. **Quadrant** - Four-quadrant analysis charts
17. **Radar** - Radar/spider charts
18. **Requirement** - Requirements modeling
19. **Sankey** - Flow diagrams showing quantities
20. **Timeline** - Chronological event timelines
21. **Treemap** - Hierarchical data visualization
22. **XYChart** - Scatter plots and line charts

#### **Diagram Structure Pattern:**

Each diagram type follows a consistent structure:

```typescript
export const diagram = {
  parser: parserDefinition, // JISON or custom parser
  db: databaseClass, // Data management and state
  renderer: rendererFunction, // SVG rendering logic
  styles: stylingDefinition, // CSS styling
  init: initializationFunction, // Setup and configuration
};
```

### Rendering System

#### 1. **Core Rendering (`rendering-util/`)**

- **`render.ts`**: Main rendering orchestrator with pluggable layout algorithms
- **`createGraph.ts`** & **`createText.ts`**: Basic shape and text creation
- **`insertElementsForSize.ts`**: Element sizing and positioning
- **`setupViewPortForSVG.ts`**: SVG viewport management

#### 2. **Layout Algorithms (`layout-algorithms/`)**

- **Dagre**: Default hierarchical layout algorithm
- **Elk**: Advanced layout engine with multiple algorithms
- **Cose-Bilkent**: Physics-based layout for complex graphs
- **Tidy-Tree**: Tree layout algorithm

#### 3. **Styling & Theming**

- **`themes/`**: Multiple built-in themes (default, dark, forest, neutral, etc.)
- **`styles.ts`**: CSS-in-JS styling system
- Theme inheritance and customization capabilities

### Security & Safety

#### 1. **Security Levels**

- **Sandbox Mode**: Renders diagrams in sandboxed iframes to prevent script execution
- **Loose Mode**: Standard rendering with sanitization
- **Strict Mode**: Enhanced security with limited functionality

#### 2. **Content Sanitization**

- **DOMPurify Integration**: XSS protection for user-generated content
- Input validation and sanitization
- Safe handling of external content

### Extension & Integration System

#### 1. **External Diagram Support**

- Dynamic loading of custom diagram types
- Plugin architecture for extending functionality
- External diagram definition interface

#### 2. **Layout Extension**

- Pluggable layout algorithms
- Custom layout loader registration
- Runtime algorithm selection

#### 3. **Icon System**

- **`icons.ts`**: Icon pack management
- SVG icon rendering
- Customizable icon libraries

### Package Structure (Monorepo)

The repository uses a monorepo structure with pnpm workspaces:

#### **Main Packages:**

- **`packages/mermaid/`**: Core Mermaid library
- **`packages/mermaid-example-diagram/`**: Example external diagram
- **`packages/mermaid-layout-elk/`**: Elk layout algorithm
- **`packages/mermaid-layout-tidy-tree/`**: Tidy tree layout
- **`packages/mermaid-zenuml/`**: ZenUML integration
- **`packages/parser/`**: Parser utilities
- **`packages/tiny/`**: Minimal Mermaid build

#### **Supporting Infrastructure:**

- **`docs/`**: Documentation and website content
- **`demos/`**: Example implementations
- **`cypress/`**: End-to-end testing
- **`tests/`**: Unit and integration tests

### Development & Build System

#### 1. **Build Pipeline**

- **ESBuild**: Fast JavaScript bundling
- **TypeScript**: Type checking and compilation
- **Vite**: Development server and hot reloading

#### 2. **Testing Strategy**

- **Vitest**: Unit testing framework
- **Cypress**: End-to-end visual regression testing
- **Applitools**: Visual testing integration
- **Argos**: PR visual regression testing

#### 3. **Code Quality**

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **CSpell**: Spell checking for documentation

## Integration Ecosystem

### Official Integrations

- **Mermaid Chart**: Commercial diagram editor and collaboration platform
- **GitHub**: Native Mermaid support in GitHub Markdown
- **GitLab**: Built-in Mermaid rendering

### Community Integrations

- **Productivity Tools**: Notion, Confluence, Obsidian, etc.
- **Development Tools**: VS Code, IntelliJ, various editors
- **Documentation**: GitBook, Docusaurus, VuePress, etc.
- **Communication**: Slack, Discord, Microsoft Teams
- **CMS/Wiki Systems**: MediaWiki, TiddlyWiki, etc.

## Usage Patterns

### 1. **Direct Web Integration**

```javascript
import mermaid from 'mermaid';
mermaid.initialize({ startOnLoad: true });
```

### 2. **Programmatic API Usage**

```javascript
const { svg } = await mermaid.render('graphDiv', 'graph TD; A-->B');
```

### 3. **Configuration & Customization**

```javascript
mermaid.initialize({
  theme: 'dark',
  flowchart: { useMaxWidth: true },
  sequence: { actorMargin: 50 },
});
```

## Future Extensibility

The architecture is designed for extensibility through:

- **Plugin System**: Easy addition of new diagram types
- **Layout Algorithms**: Pluggable layout engines
- **Theming**: Comprehensive theme customization
- **Output Formats**: Support for multiple output formats
- **Integration APIs**: Well-defined interfaces for third-party integration

This modular architecture makes Mermaid a powerful platform for diagram generation that can grow and adapt to new use cases while maintaining backward compatibility and performance.
