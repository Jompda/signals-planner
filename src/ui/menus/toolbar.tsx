import Tool from '../tool'
import { setActiveTool } from '../toolcontroller'

import 'leaflet-toolbar'
import { Toolbar2 } from 'leaflet'
import { ToolAction } from '../../interfaces'
import { ToolCategory } from '../toolcategory'


export function createSpToolbar(map: L.Map, tools: Array<Tool>, options: any) {
    setActiveTool(tools[0], map)

    const tb = new Toolbar2.Control({
        position: 'topleft',
        actions: toolsToActions(map, tools)
    })

    /*map.on(L.Draw.Event.TOOLBAROPENED, () =>
        tb._ul.firstChild.firstChild.click()
    )*/

    return tb
}


function toolsToActions(map: L.Map, tools: Array<Tool>) {
    const actions = new Array()
    for (const tool of tools) {
        const options: any = {
            toolbarIcon: tool.icon,
        }
        if (tool.actions) options.subToolbar = createSubToolbar(tool.actions)
        actions.push(Toolbar2.Action.extend({
            options,
            addHooks: tool.enableOnClick
                ? !(tool instanceof ToolCategory)
                    ? () => setActiveTool(tool, map)
                    : undefined
                : undefined
        }))
    }
    return actions
}


function createSubToolbar(actions: Array<ToolAction>) {
    return new Toolbar2({
        actions: actions.map(action => {
            return Toolbar2.Action.extend({
                options: {
                    toolbarIcon: action.icon
                },
                initialize: function (map: L.Map, action: any) {
                    this.map = map
                    this.action = action
                    Toolbar2.Action.prototype.initialize.call(this)
                },
                addHooks: action.enable,
                removeHooks: action.disable
            })
        })
    })
}