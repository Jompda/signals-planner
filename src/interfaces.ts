import * as L from 'leaflet'
import { Symbol as MilSymbol } from 'milsymbol'
import Unit from './struct/unit'


export interface ExtendedMapOptions extends L.MapOptions {
    contextmenu: boolean
    contextmenuWidth: number
    contextmenuItems: Array<ContextMenuItem>
}

export interface ExtendedMarkerOptions extends L.MarkerOptions {
    contextmenu?: boolean
    contextmenuWidth?: number
    contextmenuItems?: Array<ContextMenuItem>
}

export interface ExtendedLayerOptions extends L.LayerOptions {
    contextmenu?: boolean
    contextmenuWidth?: number
    contextmenuItems?: Array<ContextMenuItem>
}

export interface ContextMenuItem {
    text?: string
    index?: number
    callback?: (e: L.LeafletMouseEvent) => any
    icon?: string
    separator?: boolean
}


export interface UnitOptions {
    id: string
    latlng: L.LatLng
    symbol: MilSymbol
}

export interface LinkOptions {
    id: string
    unit0: Unit
    unit1: Unit
    // Medium
}