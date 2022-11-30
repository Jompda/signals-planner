import { Control, ControlPosition, LatLng as LLatLng, LeafletMouseEvent, Map as LMap } from 'leaflet'
import { Symbol as MilSymbol, SymbolOptions } from 'milsymbol'
import { CableMedium, Medium, RadioMedium } from './struct/medium'
import Unit from './struct/unit'


declare module 'leaflet' {
    export class Toolbar2 {
        constructor(options: ControlOptions)
    }
    export namespace Toolbar2 {
        export class Control {
            constructor(options: ControlOptions)
            addTo(map: LMap): this
        }
        export class Action {
            static extend(options: ControlOptions): Action
            initialize(): void
        }
    }
    export interface MapOptions {
        contextmenu?: boolean
        contextmenuWidth?: number
        contextmenuItems?: Array<ContextMenuItem>
    }
    export interface LayerOptions {
        contextmenu?: boolean
        contextmenuWidth?: number
        contextmenuItems?: Array<ContextMenuItem>
    }
    export interface Layer {
        setInteractive(state: boolean): void
        setDraggable(state: boolean): void
    }
    export namespace Control {
        export class LayerControl {
            constructor(layers: Record<string, Layer>, options?: ControlOptions)
        }
        export class OptionsMenu {
            constructor(options?: ControlOptions)
        }
        export class CustomToolbar {
            constructor(items: Array<IToolbarItem>, options?: ControlOptions)
        }
    }
    export namespace control {
        export function layerControl(layers: Record<string, Layer>, options: ControlOptions): Control
        export function optionsMenu(options?: ControlOptions): Control
        export function customToolbar(items: Array<IToolbarItem>, options?: ControlOptions): Control
        export function dialog(options?: LeafletDialogOptions): LeafletDialog
        export function ruler(options?: any): Control
    }
}


export interface LeafletDialogOptions {
    size?: Array<number>
    maxSize?: Array<number>
    minSize?: Array<number>
    anchor?: Array<number>
    position?: ControlPosition
    initOpen?: boolean
    onClose?: Function
    destroyOnClose?: boolean
}


export interface LeafletDialog extends Control {
    identifier: string
    _container: HTMLElement
    setContent: (el: HTMLElement) => void
    open: Function
    close: Function
    destroy: Function
}


export interface IToolbarItem {
    tooltip?: string
    icon: string | JSX.Element
    /** Defaults to true */
    radio?: boolean
    items?: Array<IToolbarItem>
    addHooks?: (map: LMap) => void
    removeHooks?: (map: LMap) => void
}


export interface ToolOptions {
    tooltip?: string
    icon: string | JSX.Element
    items?: Array<IToolbarItem>
    /** true by default */
    radio?: boolean
    /** true by default */
    unitSelecting?: boolean
    /** true by default */
    unitDragging?: boolean
    mmbInfo?: boolean
    areaSelect?: boolean
}


export interface ContextMenuItem {
    text?: string
    index?: number
    callback?: (e: LeafletMouseEvent) => any
    icon?: string
    separator?: boolean
}


export type SourceName = 'elevation' | 'treeHeight'
export interface TiledataLatLng extends Record<SourceName, number> {
    tileName: string
    latlng: LLatLng
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

export type MediumType = 'radio' | 'cable'

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
    symbolOptions: SymbolOptions
}

export interface SaveLink {
    unit0: string
    unit1: string
    medium: SaveRadioMedium | SaveCableMedium | string
}

export interface SaveMedium {
    type: MediumType
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
}

export interface RadioLinkEstimate {
    itmLoss: number
    dB: number
}

export interface CableLinkEstimate {
    length: number
    cables: number
}

export interface LinkEstimateOptions {
    lineStats: LineStats
    values: Array<TiledataLatLng>
    emitterHeight: number
}

export type MediumResolvable = RadioMedium | SaveRadioMedium | CableMedium | SaveCableMedium | Medium | string