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
export function setActiveTool(tool: Tool, map: LMap) {
    //if (activeTool) activeTool.removeHooks(map)
    //tool.addHooks(map)
    activeTool = tool
}

export function isDefaultTool() {
    return activeTool == defaultTool
}


export function initMapHooks(map: LMap) {
    let startLatLng: LatLng
    let highlightBbox: Rectangle
    map.on('mousedown', (e) => {
        if (!activeTool.areaSelect || getMap().dragging.enabled()) return
        startLatLng = e.latlng
        highlightBbox = rectangle(latLngBounds(startLatLng, startLatLng)).addTo(map)
    })
    map.on('mousemove', (e) => {
        if (!highlightBbox || getMap().dragging.enabled()) return
        highlightBbox.setBounds(latLngBounds(startLatLng, e.latlng))
    })
    map.on('mouseup', (e) => {
        if (!highlightBbox || getMap().dragging.enabled()) return
        activeTool.bboxselect(e, latLngBounds(startLatLng, e.latlng))
        highlightBbox.remove()
        highlightBbox = undefined
        startLatLng = undefined
    })
    map.on('keydown', (e: LeafletKeyboardEvent) => {
        if (e.originalEvent.key == 'Control') {
            getMap().dragging.disable()
            setUnitDragging(false)
        }
    })
    map.on('keyup', (e: LeafletKeyboardEvent) => {
        if (e.originalEvent.key == 'Control') {
            getMap().dragging.enable()
            setUnitDragging(true)
        }
    })
}


export function unitLayerMouseDown(e: LeafletMouseEvent, unitLayer: UnitLayer) {
    activeTool.unitlayermousedown(e, unitLayer)
}
export function unitLayerMouseUp(e: LeafletMouseEvent, unitLayer: UnitLayer) {
    activeTool.unitlayermouseup(e, unitLayer)
}
export function unitLayerClick(e: LeafletMouseEvent, unitLayer: UnitLayer) {
    activeTool.unitlayerclick(e, unitLayer)
}
export function linkLayerClick(e: LeafletMouseEvent, linkLayer: LinkLayer) {
    activeTool.linklayerclick(e, linkLayer)
}
