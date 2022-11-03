import * as L from 'leaflet'

export interface ExtendedMapOptions extends L.MapOptions {
    contextmenu: boolean
    contextmenuWidth: number
    contextmenuItems: Array<ContextMenuItem>
}

export interface ContextMenuItem {
    text?: string
    index?: number
    callback?: (e: L.LeafletMouseEvent) => any,
    icon?: string
    separator?: boolean
}