import Tool from './tool'
import defaultTool from './tools/defaultool'
import { LeafletMouseEvent, Map as LMap } from 'leaflet'
import UnitLayer from './components/unitlayer'
import LinkLayer from './components/linklayer'


let activeTool: Tool

export function getActiveTool() {
    return activeTool
}
export function setActiveTool(tool: Tool, map: LMap) {
    if (activeTool) activeTool.disable(map)
    tool.enable(map)
    activeTool = tool
}

export function isDefaultTool() {
    return activeTool == defaultTool
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
