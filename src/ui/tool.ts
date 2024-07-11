import { LatLngBounds, LeafletKeyboardEvent, Map as LMap } from 'leaflet'
import { LeafletMouseEvent } from 'leaflet'
import { ToolOptions, IToolbarItem } from '../interfaces'
import { openInfoPopup } from '../topoutil'
import LinkLayer from './components/linklayer'
import UnitLayer from './components/unitlayer'
import { showLinkStatistics } from './menus/linkstatisticsmenu'
import { getMap, getUnitLayers, setUnitDragging } from './structurecontroller'
import { setActiveTool } from './toolcontroller'


const leafletMapEvents = [
    'click',
    'middlemouseclick',
    'dblclick',
    'mousedown',
    'mouseup',
    'mouseover',
    'mouseout',
    'mousemove',
    'contextmenu',
    'keypress',
    'keydown',
    'keyup',
    'preclick'
]


/**
 * Internal event handlers start with an underscore.
 * If a method without the underscore exists, it is called after the internal event handler is called.
 */
export default class Tool implements IToolbarItem {
    public name: string
    public tooltip: string
    public icon: string | JSX.Element
    public items: Array<IToolbarItem>
    public radio: boolean
    public unitSelecting: boolean
    public unitDragging: boolean
    public mmbInfo: boolean
    public areaSelect: boolean
    constructor(options: ToolOptions) {
        this.name = options.name
        this.tooltip = options.tooltip
        this.icon = options.icon
        this.items = options.items
        this.radio = options.radio
        this.mmbInfo = options.mmbInfo
        this.areaSelect = options.areaSelect
        if (!('unitSelecting' in options)) this.unitSelecting = true
        if (!('radio' in options)) this.radio = true
        if (!('unitDragging' in options)) this.unitDragging = true
    }
    addHooks(map: LMap) {
        if (this.radio) setActiveTool(this)
        for (const event of leafletMapEvents) {
            map.on(event, (this as any)['_' + event], this)
            if (event in this) map.on(event, (this as any)[event], this)
        }
        setUnitDragging(this.unitDragging)
        this.onEnabled()
    }
    removeHooks(map: LMap) {
        for (const event of leafletMapEvents) {
            map.off(event, (this as any)['_' + event], this)
            if (event in this) map.off(event, (this as any)[event], this)
        }
        this.onDisabled()
    }
    onEnabled() { }
    onDisabled() { }
    _mouseup(e: LeafletMouseEvent) {
        if (e.originalEvent.button === 1) {
            this._middlemouseclick(e)
            if ('middlemouseclick' in this) {
                (this as any).middlemouseclick(e)
            }
        }
    }
    _click(e: LeafletMouseEvent) {
        if (!e.originalEvent.ctrlKey)
            for (const unitLayer of getUnitLayers())
                unitLayer.deselect()
    }
    _middlemouseclick(e: LeafletMouseEvent) {
        if (this.mmbInfo && (e.originalEvent.target as HTMLElement).id === 'map')
            openInfoPopup(getMap(), e.latlng)
    }
    _dblclick(e: LeafletMouseEvent) { }
    _mousedown(e: LeafletMouseEvent) { }
    _mouseover(e: LeafletMouseEvent) { }
    _mouseout(e: LeafletMouseEvent) { }
    _mousemove(e: LeafletMouseEvent) { }
    _contextmenu(e: LeafletMouseEvent) { }
    _keypress(e: LeafletKeyboardEvent) { }
    _keydown(e: LeafletKeyboardEvent) { }
    _keyup(e: LeafletKeyboardEvent) { }
    _preclick(e: LeafletMouseEvent) { }

    _unitlayermousedown(e: LeafletMouseEvent, unitLayer: UnitLayer) {
        if ('unitlayermousedown' in this) (this as any).unitlayermousedown(e, unitLayer)
    }
    _unitlayermouseup(e: LeafletMouseEvent, unitLayer: UnitLayer) {
        if (e.originalEvent.button == 1)
            if (this.mmbInfo) unitLayer.openInfoPopup()
        if ('unitlayermouseup' in this) (this as any).unitlayermouseup(e, unitLayer)
    }
    _unitlayerclick(e: LeafletMouseEvent, unitLayer: UnitLayer) {
        if (!this.unitSelecting) return
        if (e.originalEvent.ctrlKey) unitLayer.toggleSelect()
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
        if ('unitlayerclick' in this) (this as any).unitlayerclick(e, unitLayer)
    }
    _linklayerclick(e: LeafletMouseEvent, linkLayer: LinkLayer) {
        if ('linklayerclick' in this) (this as any).linklayerclick(e, linkLayer)
    }
    _linklayermousedown(e: LeafletMouseEvent, linkLayer: LinkLayer) {
        if ('linklayermousedown' in this) (this as any).linklayermousedown(e, linkLayer)
    }
    _linklayermouseup(e: LeafletMouseEvent, linkLayer: LinkLayer) {
        if (e.originalEvent.button === 1)
            if (this.mmbInfo) showLinkStatistics(getMap(), linkLayer)
        if ('linklayermouseup' in this) (this as any).linklayermouseup(e, linkLayer)
    }

    _bboxselect(e: LeafletMouseEvent, bounds: LatLngBounds) {
        if ('bboxselect' in this) (this as any).bboxselect(e, bounds)
    }
}