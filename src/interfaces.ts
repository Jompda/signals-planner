import { LatLng as LLatLng, MapOptions, LayerOptions, MarkerOptions, LeafletMouseEvent } from 'leaflet'
import { Symbol as MilSymbol } from 'milsymbol'
import Unit from './struct/unit'


export interface ExtendedMapOptions extends MapOptions {
    contextmenu: boolean
    contextmenuWidth: number
    contextmenuItems: Array<ContextMenuItem>
}

export interface ExtendedMarkerOptions extends MarkerOptions {
    contextmenu?: boolean
    contextmenuWidth?: number
    contextmenuItems?: Array<ContextMenuItem>
}

export interface ExtendedLayerOptions extends LayerOptions {
    contextmenu?: boolean
    contextmenuWidth?: number
    contextmenuItems?: Array<ContextMenuItem>
}

export interface ContextMenuItem {
    text?: string
    index?: number
    callback?: (e: LeafletMouseEvent) => any
    icon?: string
    separator?: boolean
}


export interface UnitOptions {
    id: string
    latlng: LLatLng
    symbol: MilSymbol
}

export interface LinkOptions {
    unit0: Unit
    unit1: Unit
    // Medium
}

export interface LineStats {
    delta: number
    extremes: {
        min: number
        iMin: number
        max: number
        iMax: number
    }
    peaks: {
        values: Array<number>
        indexes: Array<number>
    }
    highestObstacle: {
        elevation: number
        index: number
    }
}


export interface SaveStructure {
    units: Array<SaveUnit>
    links: Array<SaveLink>
    view: {
        center: LatLng
        zoom: number
    }
}

export interface SaveUnit {
    id: string
    latlng: LatLng
    symbolOptions: any
}

export interface SaveLink {
    unit0: string
    unit1: string
}