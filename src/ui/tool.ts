import { LatLngBounds, LeafletKeyboardEvent, Map as LMap } from 'leaflet'
import { LeafletMouseEvent } from 'leaflet'
import { ToolOptions, IToolbarItem } from '../interfaces'
import LinkLayer from './components/linklayer'
import UnitLayer from './components/unitlayer'
import { getUnitLayers, setUnitDragging } from './structurecontroller'
import { setActiveTool } from './toolcontroller'


const interactionEvents = [
    'click',
    'middlemouseclick',
    'dblclick',
    'mousedown',
    'mouseup',
    'mouseover',
    'mouseout',
    'mousemove',
    'contextmenu', // Right click
    'keypress',
    'keydown',
    'keyup',
    'preclick' // Fired before actual click handlers run
]


export default class Tool implements IToolbarItem {
    public tooltip: string
    public icon: string | JSX.Element
    public items: Array<IToolbarItem>
    public radio: boolean
    public unitSelecting: boolean
    public unitDragging: boolean
    public mmbTopography: boolean
    public areaSelect: boolean
    constructor(options: ToolOptions) {
        this.tooltip = options.tooltip
        this.icon = options.icon
        this.items = options.items
        this.radio = options.radio
        this.mmbTopography = options.mmbTopography
        this.areaSelect = options.areaSelect
        if (!('unitSelecting' in options)) this.unitSelecting = true
        if (!('radio' in options)) this.radio = true
        if (!('unitDragging' in options)) this.unitDragging = true
    }
    addHooks(map: LMap) {
        if (this.radio) setActiveTool(this, map)
        for (const event of interactionEvents)
            map.on(event, (this as any)[event], this)
        setUnitDragging(this.unitDragging)
        this.onEnabled()
    }
    removeHooks(map: LMap) {
        for (const event of interactionEvents)
            map.off(event, (this as any)[event], this)
        this.onDisabled()
    }
    onEnabled() { }
    onDisabled() { }
    mouseup(e: LeafletMouseEvent) {
        if (e.originalEvent.button === 1)
            if ('middlemouseclick' in this) (this as any).middlemouseclick(e)
    }
    click(e: LeafletMouseEvent) { }
    middlemouseclick(e: LeafletMouseEvent) { }
    dblclick(e: LeafletMouseEvent) { }
    mousedown(e: LeafletMouseEvent) { }
    mouseover(e: LeafletMouseEvent) { }
    mouseout(e: LeafletMouseEvent) { }
    mousemove(e: LeafletMouseEvent) { }
    contextmenu(e: LeafletMouseEvent) { }
    keypress(e: LeafletKeyboardEvent) { }
    keydown(e: LeafletKeyboardEvent) { }
    keyup(e: LeafletKeyboardEvent) { }
    preclick(e: LeafletMouseEvent) { }

    unitlayermousedown(e: LeafletMouseEvent, unitLayer: UnitLayer) { }
    unitlayermouseup(e: LeafletMouseEvent, unitLayer: UnitLayer) { }
    unitlayerclick(e: LeafletMouseEvent, unitLayer: UnitLayer) {
        if (!this.unitSelecting) return
        if (e.originalEvent.ctrlKey) {
            unitLayer.toggleSelect()
        }
        else {
            let otherSelection = false
            for (const unit of getUnitLayers()) {
                if (unit.unit.id != unitLayer.unit.id) {
                    if (unit.isSelected()) otherSelection = true
                    unit.deselect()
                }
            }
            unitLayer.toggleSelect()
            if (otherSelection) unitLayer.select()
        }

    }
    linklayerclick(e: LeafletMouseEvent, linkLayer: LinkLayer) {
        // TODO Linklayerclick
    }

    bboxselect(e: LeafletMouseEvent, bounds: LatLngBounds) { }
}