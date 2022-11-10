declare module 'mgrs' {
    export function forward(arr: Array<number>): string
    export function toPoint(mgrs: string): Array<number>
}

declare module 'leaflet.wms'

declare interface LatLng {
    lat: number
    lng: number
}