import Tool from './tool'
import defaultTool from './tools/defaultool'


let activeTool: Tool

setActiveTool(defaultTool)

export function getActiveTool() {
    return activeTool
}
export function setActiveTool(tool: Tool) {
    if (activeTool) activeTool.disable()
    tool.enable()
    activeTool = tool
}

export function isDefaultTool() {
    return activeTool == defaultTool
}

