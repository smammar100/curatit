// The post prototype's directions, in a module of their own: a "use client" module's exports
// reach a server component as client references, so an array exported from PostProto wouldn't be one
export const DIRECTIONS = ["card", "studio", "pin", "shot", "inspector"] as const;
export type Direction = (typeof DIRECTIONS)[number];
