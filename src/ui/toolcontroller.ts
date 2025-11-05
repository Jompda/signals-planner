import Tool from './tool'
import defaultTool from './tools/defaultool'
import { LatLng, latLngBounds, LeafletKeyboardEvent, LeafletMouseEvent, Map as LMap, rectangle, Rectangle } from 'leaflet'
import UnitLayer from './components/unitlayer'
import LinkLayer from './components/linklayer'
import { getMap, setUnitDragging } from './structurecontroller'


let activeTool: Tool

export function getActiveTool() {
    return activeTool
}
export function setActiveTool(tool: Tool) {
    activeTool = tool
}

export function isDefaultTool() {
    return activeTool == defaultTool
}


export function initMapHooks(map: LMap) {
    let startLatLng: LatLng
    let highlightBbox: Rectangle
    map.on('mousedown', (e) => {
        if (!activeTool) return
        if (!activeTool.areaSelect || getMap().dragging.enabled()) return
        startLatLng = e.latlng
        highlightBbox = rectangle(latLngBounds(startLatLng, startLatLng))
    })
    map.on('mousemove', (e) => {
        if (!activeTool) return
        if (!highlightBbox || getMap().dragging.enabled()) return
        if (!(highlightBbox as any)._map) highlightBbox.addTo(getMap())
        highlightBbox.setBounds(latLngBounds(startLatLng, e.latlng))
    })
    map.on('mouseup', (e) => {
        if (!activeTool) return
        if (!highlightBbox || getMap().dragging.enabled()) return
        if ((highlightBbox as any)._map) {
            activeTool._bboxselect(e, latLngBounds(startLatLng, e.latlng))
            highlightBbox.remove()
        }
        highlightBbox = undefined
        startLatLng = undefined
    })
    map.on('keydown', (e: LeafletKeyboardEvent) => {
        if (!activeTool) return
        if (activeTool.areaSelect) {
            if (e.originalEvent.key == 'Control') {
                getMap().dragging.disable()
                setUnitDragging(false)
            }
        }
    })
    map.on('keyup', (e: LeafletKeyboardEvent) => {
        if (!activeTool) return
        if (activeTool.areaSelect) {
            if (e.originalEvent.key == 'Control') {
                getMap().dragging.enable()
                setUnitDragging(true)
            }
        }
    })
}


export function unitLayerMouseDown(e: LeafletMouseEvent, unitLayer: UnitLayer) {
    if (!activeTool) return
    activeTool._unitlayermousedown(e, unitLayer)
}
export function unitLayerMouseUp(e: LeafletMouseEvent, unitLayer: UnitLayer) {
    if (!activeTool) return
    activeTool._unitlayermouseup(e, unitLayer)
}
export function unitLayerClick(e: LeafletMouseEvent, unitLayer: UnitLayer) {
    if (!activeTool) return
    activeTool._unitlayerclick(e, unitLayer)
}
export function linkLayerClick(e: LeafletMouseEvent, linkLayer: LinkLayer) {
    if (!activeTool) return
    activeTool._linklayerclick(e, linkLayer)
}
export function linkLayerMouseDown(e: LeafletMouseEvent, linkLayer: LinkLayer) {
    if (!activeTool) return
    activeTool._linklayermousedown(e, linkLayer)
}
export function linkLayerMouseUp(e: LeafletMouseEvent, linkLayer: LinkLayer) {
    if (!activeTool) return
    activeTool._linklayermouseup(e, linkLayer)
}
