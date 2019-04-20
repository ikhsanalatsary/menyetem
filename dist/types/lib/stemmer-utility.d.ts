declare function isStartsWith(text: string, byTextLength: number, prefix: string): boolean;
declare function isEndsWith(text: string, byTextLength: number, suffix: string): boolean;
interface Position {
    isStartsWith: string;
    isEndsWith: string;
}
export declare type PositionKeys = keyof Position;
declare const _default: {
    isStartsWith: typeof isStartsWith;
    isEndsWith: typeof isEndsWith;
};
export default _default;
//# sourceMappingURL=stemmer-utility.d.ts.map