declare module 'mgrs' {
    export function forward(arr: Array<number>): string
    export function toPoint(mgrs: string): Array<number>
}

declare module 'leaflet.wms'

declare module '*.png' {
    const value: any;
    export default value;
}

declare module 'leaflet-ruler'
