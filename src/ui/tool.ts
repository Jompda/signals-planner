import { Map as LMap } from 'leaflet'
import { LeafletMouseEvent } from 'leaflet'


export interface ToolOptions {
    icon: JSX.Element
}


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
    public icon: string
    private events: any
    constructor(options?: ToolOptions) {
        Object.assign(this, options)
        this.events = {}
        for (const event of interactionEvents)
            if (event in this) this.events[event] = (this as any)[event]
    }
    enable(map: LMap) {
        for (const event in this.events)
            map.on(event, this.events[event], this)
        this.onEnabled()
    }
    disable(map: LMap) {
        for (const event in this.events)
            map.off(event, this.events[event], this)
        this.onDisabled()
    }
    onEnabled() { }
    onDisabled() { }
    mouseup(e: LeafletMouseEvent) {
        if (e.originalEvent.button === 1)
            if ('middlemouseclick' in this) (this as any).middlemouseclick(e)
    }
}