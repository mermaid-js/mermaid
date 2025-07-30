export interface TreeData {
    parentById: Record<string, string>;
    childrenById: Record<string, string[]>;
}
export declare const findCommonAncestor: (id1: string, id2: string, { parentById }: TreeData) => string;
