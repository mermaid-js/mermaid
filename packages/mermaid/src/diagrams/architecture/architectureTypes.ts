import type { DiagramDB } from '../../diagram-api/types.js';
import type { ArchitectureDiagramConfig } from '../../config.type.js';
import type { D3Element } from '../../mermaidAPI.js';

export type ArchitectureDirection = 'L' | 'R' | 'T' | 'B'
export const isArchitectureDirection = function(x: unknown): x is ArchitectureDirection {
    const temp = x as ArchitectureDirection;
    return (temp === 'L' || temp === 'R' || temp === 'T' || temp === 'B')
}
export const isArchitectureDirectionX = function(x: ArchitectureDirection): x is Extract<ArchitectureDirection, 'L' | 'R'> {
    const temp = x as Extract<ArchitectureDirection, 'L' | 'R'>
    return (temp === 'L' || temp === 'R')
}
export const isArchitectureDirectionY = function(x: ArchitectureDirection): x is Extract<ArchitectureDirection, 'T' | 'B'> {
    const temp = x as Extract<ArchitectureDirection, 'T' | 'B'>
    return (temp === 'T' || temp === 'B')
}

export interface ArchitectureStyleOptions {
    fontFamily: string;
}

export interface ArchitectureService {
    id: string;
    icon?: string;
    title?: string;
    in?: string;
}

export interface ArchitectureGroup {
    id: string;
    icon?: string;
    title?: string;
    in?: string;
}

export interface ArchitectureLine {
    lhs_id: string;
    lhs_dir: ArchitectureDirection;
    title?: string;
    rhs_id: string;
    rhs_dir: ArchitectureDirection;
    lhs_into?: boolean;
    rhs_into?: boolean;
}

export interface ArchitectureDB extends DiagramDB {
    addService: (id: string, opts: Omit<ArchitectureService, "id">)  => void
    getServices: () => ArchitectureService[]
    addGroup: (id: string, opts: Omit<ArchitectureGroup, "id">)  => void
    getGroups: () => ArchitectureGroup[]
    addLine: (lhs_id: string, lhs_dir: ArchitectureDirection, rhs_id: string, rhs_dir: ArchitectureDirection, opts: Omit<ArchitectureLine, "lhs_id" | "lhs_dir" | "rhs_id" | "rhs_dir">)  => void
    getLines: () => ArchitectureLine[]
    setElementForId:  (id: string, element: D3Element) => void;
    getElementById: (id: string) => D3Element;
}

export interface ArchitectureFields {
    services: ArchitectureService[],
    groups: ArchitectureGroup[],
    lines: ArchitectureLine[],
    cnt: number,
    config: ArchitectureDiagramConfig
}