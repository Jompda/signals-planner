import { LatLng as LLatLng, MapOptions, LayerOptions, MarkerOptions, LeafletMouseEvent } from 'leaflet'
import { Symbol as MilSymbol } from 'milsymbol'
import { CableMedium, Medium, RadioMedium } from './struct/medium'
import Unit from './struct/unit'


declare module 'leaflet' {
    export class Toolbar2 {
        constructor(options: any)
    }
    export namespace Toolbar2 {
        export class Control {
            constructor(options: any)
        }
        export class Action {
            static extend(options: any): any
            initialize(): any
        }
    }
}


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
    medium: MediumResolvable
}

export interface MediumOptions {
    name: string
    preset?: boolean
}

export interface RadioMediumOptions extends MediumOptions {
    /** Frequency in MHz. */
    frequency: number
    /** Beam width in degrees. */
    beamWidth?: number
    /** Transmitted power. */
    Pt: number
    /** Transmitting antenna gain. */
    Gt: number
    /** Receiving antenna gain. */
    Gr: number
}

export interface CableMediumOptions extends MediumOptions {
    /** Length of a single extendable cable. */
    cableLength: number
    /** For instance copper: 1.68 * 10**(-8) ohm m. */
    resistivity: number
    /** For instance from diameter of 12mm to area = PI*(d/2)^2 => PI*(0.012 / 2)**2. */
    sliceArea: number
}

export interface LineStats {
    distance: number
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
        height: number
        index: number
    }
}


export interface SaveStructure {
    units: Array<SaveUnit>
    links: Array<SaveLink>
    center: LatLng
    zoom: number
    drawings: Array<any>
}

export interface SaveUnit {
    id: string
    latlng: LatLng
    symbolOptions: any
}

export interface SaveLink {
    unit0: string
    unit1: string
    medium: SaveRadioMedium | SaveCableMedium | string
}

export interface SaveMedium {
    type: 'radio' | 'cable'
    name: string
}

export interface SaveRadioMedium extends SaveMedium {
    type: 'radio'
    frequency: number
    beamWidth?: number
    Pt: number
    Gt: number
    Gr: number
}

export interface SaveCableMedium extends SaveMedium {
    type: 'cable'
    cableLength: number
    resistivity: number
    sliceArea: number
}

export type MediumResolvable = RadioMedium | SaveRadioMedium | CableMedium | SaveCableMedium | Medium | string