import Tool from './tool'
import defaultTool from './tools/defaultool'
import { Map as LMap } from 'leaflet'


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

