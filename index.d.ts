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
    export function setConfig<SourceName extends string>(options: {
        sources: Array<{
            name: SourceName
            type: 'wmts' | 'wms'
            url: string
            layers?: string
            valueFunction: (r: number, g: number, b: number) => number
        }>
        saveDataByTile: (name: string, data: Record<SourceName, Int16Array>) => void
        getDataByTile: (name: string) => Record<SourceName, Int16Array>
    }): any
    export function getTiledata<SourceName extends string>
        (tileCoords: TileCoords, sourceNames: SourceName[]): Promise<Record<SourceName, Int16Array>>
    export function latlngToTileCoords(latlng: LatLng, z: number): TileCoords
    export function latlngToXYOnTile(latlng: LatLng, zoom: number): Point
}

declare module 'leaflet.wms'