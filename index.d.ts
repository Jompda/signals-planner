declare module 'mgrs' {
    export function forward(arr: Array<number>): string
    export function toPoint(mgrs: string): Array<number>
}


declare interface LatLng {
    lat: number
    lng: number
}

declare interface Point {
    x: number
    y: number
}

declare interface TileCoords extends Point {
    z: number
}

declare module 'tiledata' {
    export function setConfig(options: any): any
    export function getTiledata(tileCoords: TileCoords, sourceNames: string[]): Promise<any>
    export function latlngToTileCoords(latlng: LatLng, z: number): TileCoords
    export function latlngToXYOnTile(latlng: LatLng, zoom: number): Point
}