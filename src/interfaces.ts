import { Control, ControlPosition, LatLng as LLatLng, LeafletMouseEvent, Map as LMap } from 'leaflet'
import { Symbol as MilSymbol, SymbolOptions } from 'milsymbol'
import Unit from './struct/unit'


// Since webpack doesn't like itm-webassembly
declare global {
    interface Window {
        onItmInitialize: Function
        ITM_P2P_TLS_Ex: Function
        ITM_P2P_CR_Ex: Function
        resolveReturnCode: Function
        resolveWarnings: Function
    }
}


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
        export class ZoomRatio {
            constructor(options?: ControlOptions)
        }
    }
    export namespace control {
        export function layerControl(layers: Record<string, Layer>, options: ControlOptions): Control
        export function optionsMenu(options?: ControlOptions): Control
        export function customToolbar(items: Array<IToolbarItem>, options?: ControlOptions): Control
        export function dialog(options?: LeafletDialogOptions): LeafletDialog
        export function ruler(options?: any): Control
        export function zoomRatio(options?: ControlOptions): Control
        export function notifications(options?: ControlOptions & {
            timeout: number
            closable?: boolean
            dismissable?: boolean
            className?: string
        }): Control & {
            alert: Function
            info: Function
            success: Function
            warning: Function
            custom: Function
        }
    }
}


export interface OptionsItem {
    apply: Function
    reset: Function
    element: React.JSX.Element
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
    name: string
    tooltip?: string
    icon: string | JSX.Element
    /** Defaults to true */
    radio?: boolean
    items?: Array<IToolbarItem>
    addHooks?: (map: LMap) => void
    removeHooks?: (map: LMap) => void
}


export interface ToolOptions {
    name: string
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
    emitterHeight0: number
    emitterHeight1: number
    medium: MediumResolvable
}

export type MediumType = 'radio' | 'cable'
export type MediumResolvable = RadioMediumOptions | CableMediumOptions | string

export interface MediumOptions {
    name: string
    type: MediumType
}

export interface RadioMediumOptions extends MediumOptions {
    freqMhz: number
    heightMeter: number
    beamWidthDeg?: number
}

export interface CableMediumOptions extends MediumOptions {
    cableLengthMeter: number
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
    center?: LatLng
    zoom?: number
    drawings?: Array<any>
}

export interface SaveUnit {
    id: string
    latlng: LatLng
    symbolOptions: SymbolOptions
}

export interface SaveLink {
    unit0: string
    unit1: string
    emitterHeight0: number
    emitterHeight1: number
    medium: MediumResolvable
}


export interface RadioLinkEstimate {
    A_fs__db: number
    A_ref__db: number
    A__db: number
    mode: number
    warnings: Array<string>
}

export interface CableLinkEstimate {
    length: number
    cables: number
}

export interface LinkEstimateOptions {
    lineStats: LineStats
    values: Array<TiledataLatLng>
    emitterHeight: Array<number>
}