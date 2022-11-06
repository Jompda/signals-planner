declare module 'mgrs' {
    export function forward(arr: Array<number>): string
    export function toPoint(mgrs: string): Array<number>
}

declare module 'tiledata' {
    export function setConfig(options: any): any
    export function getTiledata(tileCoords: { x: number, y: number, z: number }, sourceNames: string[]): Promise<any>
    export function latlngToTileCoords(latlng: { lat: number, lng: number }, z: number): { x: number, y: number, z: number }
    export function latlngToXYOnTile(latlng: { lat: number, lng: number }, zoom: number): { x: number, y: number }
}