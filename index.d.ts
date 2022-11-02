declare module 'mgrs' {
    export function forward(arr: number[]): string
}

declare module 'tiledata' {
    export function setConfig(options: any): any
    export function getTiledata(tileCoords: { x: number, y: number, z: number }, sourceNames: string[]): Promise<any>
}