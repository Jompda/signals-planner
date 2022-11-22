import { LeafletKeyboardEvent, Map as LMap } from 'leaflet'
import { LeafletMouseEvent } from 'leaflet'
import { ToolAction, ToolOptions } from '../interfaces'
import LinkLayer from './components/linklayer'
import UnitLayer from './components/unitlayer'
import { setUnitDragging } from './structurecontroller'


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


export default class Tool {
    public icon: any
    public enableOnClick: boolean
    public actions: Array<ToolAction>
    public unitSelecting: boolean
    public unitDragging: boolean
    public mmbTopography: boolean
    constructor(options?: ToolOptions) {
        Object.assign(this, options)
        if (!('unitSelecting' in options)) this.unitSelecting = true
        if (!('enableOnClick' in options)) this.enableOnClick = true
        if (!('unitDragging' in options)) this.unitDragging = true
    }
    enable(map: LMap) {
        for (const event of interactionEvents)
            map.on(event, (this as any)[event], this)
        setUnitDragging(this.unitDragging)
        this.onEnabled()
    }
    disable(map: LMap) {
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
        if (unitLayer.svg.classList.contains('unit-selected'))
            unitLayer.svg.classList.remove('unit-selected')
        else unitLayer.svg.classList.add('unit-selected')
    }
    linklayerclick(e: LeafletMouseEvent, linkLayer: LinkLayer) {
        // TODO Linklayerclick
    }
}