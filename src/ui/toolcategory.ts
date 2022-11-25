import Tool from './tool'
import unitlinkicon from '../assets/unitlink.png'
import { ToolAction } from '../interfaces'
import { setActiveTool } from './toolcontroller'
import { getMap } from './structurecontroller'


export class ToolCategory extends Tool {
    public tools: Array<Tool>
    constructor(tools: Array<Tool>) {
        super({
            icon: {
                tooltip: 'Link Tools',
                html: `<div class="center-content"><img src="${unitlinkicon}"/></div>`
            }
        })
        this.tools = tools

        this.actions = new Array<ToolAction>()
        for (const tool of tools) {
            this.actions.push({
                icon: tool.icon,
                enable: () => setActiveTool(tool, getMap())
            })
        }
    }
}