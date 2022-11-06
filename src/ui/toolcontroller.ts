import Tool, { DefaultTool } from './tool'


export const defaultTool = new DefaultTool()


let activeTool = defaultTool
export function getActiveTool() {
    return activeTool
}
export function setActiveTool(tool: Tool) {
    activeTool = tool
}

export function isDefaultTool() {
    return activeTool == defaultTool
}

