// Simple actor type for useCase diagrams
interface Actor {
  type: 'actor';
  name: string;
  metadata?: Record<string, string>;
}

// Simple use case type
interface UseCase {
  type: 'useCase';
  name: string;
}

// System boundary type
interface SystemBoundary {
  type: 'systemBoundary';
  name: string;
  useCases: UseCase[];
  metadata?: Record<string, string>;
}

// System boundary metadata type
interface SystemBoundaryMetadata {
  type: 'systemBoundaryMetadata';
  name: string; // boundary name
  metadata: Record<string, string>;
}

// Actor-UseCase relationship type
interface ActorUseCaseRelationship {
  type: 'actorUseCaseRelationship';
  from: string; // actor name
  to: string;   // use case name
  arrow: string; // '-->' or '->'
  label?: string; // edge label (optional)
}

// Node type
interface Node {
  type: 'node';
  id: string;   // node ID (e.g., 'a', 'b', 'c')
  label: string; // node label (e.g., 'Go through code')
}

// Actor-Node relationship type
interface ActorNodeRelationship {
  type: 'actorNodeRelationship';
  from: string; // actor name
  to: string;   // node ID
  arrow: string; // '-->' or '->'
  label?: string; // edge label (optional)
}

// Inline Actor-Node relationship type
interface InlineActorNodeRelationship {
  type: 'inlineActorNodeRelationship';
  actor: string; // actor name
  node: Node;    // node definition
  arrow: string; // '-->' or '->'
  label?: string; // edge label (optional)
}

export class UseCaseDB {
  private actors: Actor[] = [];
  private systemBoundaries: SystemBoundary[] = [];
  private systemBoundaryMetadata: SystemBoundaryMetadata[] = [];
  private useCases: UseCase[] = [];
  private relationships: ActorUseCaseRelationship[] = [];
  private nodes: Node[] = [];
  private nodeRelationships: ActorNodeRelationship[] = [];
  private inlineRelationships: InlineActorNodeRelationship[] = [];

  constructor() {
    this.clear();
  }

  clear(): void {
    this.actors = [];
    this.systemBoundaries = [];
    this.systemBoundaryMetadata = [];
    this.useCases = [];
    this.relationships = [];
    this.nodes = [];
    this.nodeRelationships = [];
    this.inlineRelationships = [];
  }

  addActor(actor: Actor): void {
    this.actors.push(actor);
  }

  addSystemBoundary(boundary: SystemBoundary): void {
    this.systemBoundaries.push(boundary);
  }

  addSystemBoundaryMetadata(metadata: SystemBoundaryMetadata): void {
    this.systemBoundaryMetadata.push(metadata);
    // Apply metadata to existing system boundary
    const boundary = this.systemBoundaries.find(b => b.name === metadata.name);
    if (boundary) {
      boundary.metadata = metadata.metadata;
    }
  }

  addUseCase(useCase: UseCase): void {
    this.useCases.push(useCase);
  }

  addRelationship(relationship: ActorUseCaseRelationship): void {
    this.relationships.push(relationship);
  }

  addNode(node: Node): void {
    this.nodes.push(node);
  }

  addNodeRelationship(relationship: ActorNodeRelationship): void {
    this.nodeRelationships.push(relationship);
  }

  addInlineRelationship(relationship: InlineActorNodeRelationship): void {
    this.inlineRelationships.push(relationship);
    // Also add the node and actor separately
    this.addNode(relationship.node);
    // Add actor if not already exists
    const actorExists = this.actors.some(actor => actor.name === relationship.actor);
    if (!actorExists) {
      this.addActor({
        type: 'actor',
        name: relationship.actor
      });
    }
  }

  getActors(): Actor[] {
    return this.actors;
  }

  getSystemBoundaries(): SystemBoundary[] {
    return this.systemBoundaries;
  }

  getSystemBoundaryMetadata(): SystemBoundaryMetadata[] {
    return this.systemBoundaryMetadata;
  }

  getUseCases(): UseCase[] {
    return this.useCases;
  }

  getRelationships(): ActorUseCaseRelationship[] {
    return this.relationships;
  }

  getNodes(): Node[] {
    return this.nodes;
  }

  getNodeRelationships(): ActorNodeRelationship[] {
    return this.nodeRelationships;
  }

  getInlineRelationships(): InlineActorNodeRelationship[] {
    return this.inlineRelationships;
  }

  parse(text: string): void {
    this.clear();

    // For now, use the simple parser with enhanced metadata support
    // TODO: Integrate ANTLR parser in the future

    // Simple parser for usecase diagrams (fallback)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('%'));

    let foundUsecase = false;
    let inSystemBoundary = false;
    let currentBoundary: SystemBoundary | null = null;
    let inMetadataBlock = false;
    let currentMetadataName = '';
    let currentMetadataContent = '';

    for (const line of lines) {
      if (line === 'usecase') {
        foundUsecase = true;
        continue;
      }

      if (!foundUsecase) {
        continue
      };

      if (line.startsWith('actor ')) {
        const actorPart = line.substring(6).trim();
        if (actorPart) {
          // Check if this is an inline actor-node relationship
          if (this.isInlineActorNodeRelationshipLine(actorPart)) {
            const relationship = this.parseInlineActorNodeRelationshipLine(actorPart);
            if (relationship) {
              this.addInlineRelationship(relationship);
            }
          } else {
            const actors = this.parseActorList(actorPart);
            actors.forEach((actor: Actor) => this.addActor(actor));
          }
        }
      } else if (line.startsWith('systemBoundary ')) {
        const boundaryPart = line.substring(15).trim();
        if (boundaryPart.endsWith(' {')) {
          // New curly brace syntax: systemBoundary Name {
          const boundaryName = boundaryPart.substring(0, boundaryPart.length - 2).trim();
          currentBoundary = {
            type: 'systemBoundary',
            name: boundaryName,
            useCases: []
          };
          inSystemBoundary = true;
        } else if (boundaryPart) {
          // Old syntax: systemBoundary Name (followed by 'end')
          currentBoundary = {
            type: 'systemBoundary',
            name: boundaryPart,
            useCases: []
          };
          inSystemBoundary = true;
        }
      } else if (line === 'end' || (line === '}' && !inMetadataBlock)) {
        if (inSystemBoundary && currentBoundary) {
          this.addSystemBoundary(currentBoundary);
          currentBoundary = null;
          inSystemBoundary = false;
        }
      } else if (inSystemBoundary && currentBoundary && line) {
        // This is a use case inside the system boundary
        const useCase: UseCase = {
          type: 'useCase',
          name: line
        };
        currentBoundary.useCases.push(useCase);
      } else if (line && !inSystemBoundary) {
        // Handle multi-line metadata blocks
        if (inMetadataBlock) {
          if (line.includes('}')) {
            // End of metadata block
            currentMetadataContent += line.replace('}', '').trim();
            const metadata = this.parseMetadataContent(currentMetadataName, currentMetadataContent);
            if (metadata) {
              this.addSystemBoundaryMetadata(metadata);
            }
            inMetadataBlock = false;
            currentMetadataName = '';
            currentMetadataContent = '';
          } else {
            // Continue collecting metadata content
            currentMetadataContent += line.trim() + ' ';
          }
        } else if (line.includes('@{')) {
          // Start of metadata block
          const match = line.match(/^(\w+)@\{(.*)$/);
          if (match) {
            currentMetadataName = match[1];
            const content = match[2].trim();
            if (content.includes('}')) {
              // Single line metadata
              const metadata = this.parseMetadataContent(currentMetadataName, content.replace('}', ''));
              if (metadata) {
                this.addSystemBoundaryMetadata(metadata);
              }
            } else {
              // Multi-line metadata
              inMetadataBlock = true;
              currentMetadataContent = content + ' ';
            }
          }
        } else if (this.isRelationshipLine(line)) {
          // Check if this is a relationship (actor --> usecase or actor --> node)
          const relationship = this.parseRelationshipLine(line);
          if (relationship) {
            if (relationship.type === 'actorUseCaseRelationship') {
              this.addRelationship(relationship);
            } else if (relationship.type === 'actorNodeRelationship') {
              this.addNodeRelationship(relationship);
            }
          }
        } else {
          // This is a standalone use case
          const useCase: UseCase = {
            type: 'useCase',
            name: line
          };
          this.addUseCase(useCase);
        }
      }
    }
  }



  private parseActorList(actorPart: string): Actor[] {
    // Smart split by comma that respects metadata braces
    const actorNames = this.smartSplitActors(actorPart);

    return actorNames.map(actorName => this.parseActorWithMetadata(actorName));
  }

  private smartSplitActors(input: string): string[] {
    const actors: string[] = [];
    let current = '';
    let braceDepth = 0;
    let inQuotes = false;
    let quoteChar = '';

    for (const char of input) {

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (!inQuotes && char === '{') {
        braceDepth++;
        current += char;
      } else if (!inQuotes && char === '}') {
        braceDepth--;
        current += char;
      } else if (!inQuotes && char === ',' && braceDepth === 0) {
        // This is a real separator, not inside metadata
        if (current.trim()) {
          actors.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last actor
    if (current.trim()) {
      actors.push(current.trim());
    }

    return actors;
  }

  private parseActorWithMetadata(actorPart: string): Actor {
    // Check if there's metadata (contains @{...})
    const metadataRegex = /^([^@]+)@{([^}]*)}$/;
    const metadataMatch = metadataRegex.exec(actorPart);

    if (metadataMatch) {
      const name = metadataMatch[1].trim();
      const metadataStr = metadataMatch[2].trim();
      const metadata = this.parseMetadataString(metadataStr);

      return {
        type: 'actor',
        name,
        metadata
      };
    } else {
      // No metadata, just return the name
      return {
        type: 'actor',
        name: actorPart
      };
    }
  }

  private parseMetadataString(metadataStr: string): Record<string, string> {
    const metadata: Record<string, string> = {};

    if (!metadataStr.trim()) {
      return metadata;
    }

    // Split by comma and parse key-value pairs
    const pairs = metadataStr.split(',');

    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':');
      if (colonIndex > 0) {
        const key = pair.substring(0, colonIndex).trim();
        let value = pair.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        metadata[key] = value;
      }
    }

    return metadata;
  }

  private isRelationshipLine(line: string): boolean {
    return line.includes('-->') || line.includes('->');
  }

  private parseRelationshipLine(line: string): ActorUseCaseRelationship | ActorNodeRelationship | null {
    let arrow = '';
    let label: string | undefined;
    let parts: string[] = [];

    // Check for labeled arrows first (--label--> or --label->)
    const labeledArrowMatch = line.match(/^(.+?)\s*(--\w+--?>)\s*(.+)$/);
    if (labeledArrowMatch) {
      parts = [labeledArrowMatch[1].trim(), labeledArrowMatch[3].trim()];
      arrow = labeledArrowMatch[2];
      // Extract label from arrow
      const labelMatch = arrow.match(/^--(\w+)--?>$/);
      if (labelMatch) {
        label = labelMatch[1];
      }
    } else if (line.includes('-->')) {
      arrow = '-->';
      parts = line.split('-->').map(part => part.trim());
    } else if (line.includes('->')) {
      arrow = '->';
      parts = line.split('->').map(part => part.trim());
    }

    if (parts.length === 2 && parts[0] && parts[1]) {
      // Check if target is a node definition (contains parentheses)
      if (this.isNodeDefinitionString(parts[1])) {
        const node = this.parseNodeDefinitionString(parts[1]);
        if (node) {
          this.addNode(node);
          return {
            type: 'actorNodeRelationship',
            from: parts[0],
            to: node.id,
            arrow,
            label
          };
        }
      } else {
        return {
          type: 'actorUseCaseRelationship',
          from: parts[0],
          to: parts[1],
          arrow,
          label
        };
      }
    }

    return null;
  }

  private isInlineActorNodeRelationshipLine(line: string): boolean {
    // Check for pattern: ActorName --> nodeId(label) or ActorName --label--> nodeId(label)
    const hasArrow = line.includes('-->') || line.includes('->') || !!line.match(/--\w+-->/);
    const hasNodeDefinition = line.includes('(') && line.includes(')');
    return hasArrow && hasNodeDefinition;
  }

  private parseInlineActorNodeRelationshipLine(line: string): InlineActorNodeRelationship | null {
    let arrow = '';
    let label: string | undefined;
    let parts: string[] = [];

    // Check for labeled arrows first (--label--> or --label->)
    const labeledArrowMatch = line.match(/^(.+?)\s*(--\w+--?>)\s*(.+)$/);
    if (labeledArrowMatch) {
      parts = [labeledArrowMatch[1].trim(), labeledArrowMatch[3].trim()];
      arrow = labeledArrowMatch[2];
      // Extract label from arrow
      const labelMatch = arrow.match(/^--(\w+)--?>$/);
      if (labelMatch) {
        label = labelMatch[1];
      }
    } else if (line.includes('-->')) {
      arrow = '-->';
      parts = line.split('-->').map(part => part.trim());
    } else if (line.includes('->')) {
      arrow = '->';
      parts = line.split('->').map(part => part.trim());
    }

    if (parts.length === 2 && parts[0] && parts[1]) {
      const node = this.parseNodeDefinitionString(parts[1]);
      if (node) {
        return {
          type: 'inlineActorNodeRelationship',
          actor: parts[0],
          node,
          arrow,
          label
        };
      }
    }

    return null;
  }

  private isNodeDefinitionString(str: string): boolean {
    return str.includes('(') && str.includes(')');
  }

  private parseNodeDefinitionString(str: string): Node | null {
    const match = str.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.+)\)$/);
    if (match) {
      return {
        type: 'node',
        id: match[1],
        label: match[2]
      };
    }
    return null;
  }

  private isSystemBoundaryMetadataLine(line: string): boolean {
    // Check for pattern: boundaryName@{...}
    return line.includes('@{') && line.includes('}');
  }

  private parseSystemBoundaryMetadataLine(line: string): SystemBoundaryMetadata | null {
    // Parse pattern: boundaryName@{key: value, key2: value2}
    const match = line.match(/^(\w+)@\{(.+)\}$/);
    if (!match) {
      return null;
    }

    const name = match[1];
    const metadataContent = match[2];
    const metadata: Record<string, string> = {};

    // Parse key-value pairs
    const pairs = metadataContent.split(',').map(pair => pair.trim());
    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':');
      if (colonIndex > 0) {
        const key = pair.substring(0, colonIndex).trim();
        let value = pair.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        metadata[key] = value;
      }
    }

    return {
      type: 'systemBoundaryMetadata',
      name,
      metadata
    };
  }

  private parseMetadataContent(name: string, content: string): SystemBoundaryMetadata | null {
    const metadata: Record<string, string> = {};

    // Parse key-value pairs from content
    const pairs = content.split(',').map(pair => pair.trim()).filter(pair => pair);
    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':');
      if (colonIndex > 0) {
        const key = pair.substring(0, colonIndex).trim();
        let value = pair.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        metadata[key] = value;
      }
    }

    return {
      type: 'systemBoundaryMetadata',
      name,
      metadata
    };
  }
}
