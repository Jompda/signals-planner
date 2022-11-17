import Tool from '../tool'
import { setActiveTool } from '../toolcontroller';

import 'leaflet-toolbar'
import * as L from 'leaflet'
const Toolbar2 = (L as any).Toolbar2;

/*const ImmediateSubAction = Toolbar2.Action.extend({
    initialize: function (map: L.Map, myAction: any) {
        this.map = map
        this.myAction = myAction
        console.log(myAction)
        Toolbar2.Action.prototype.initialize.call(this)
    },
    addHooks: function () {
        this.myAction.disable()
    }
})*/

export function createSpToolbar(map: L.Map, tools: Array<Tool>, options: any) {
    setActiveTool(tools[0], map)

    const tb = new Toolbar2.Control({
        position: 'topleft',
        actions: toolsToActions(map, tools)
    })

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
            addHooks: function () {
                setActiveTool(tool, map)
            },
        }))
    }
    return actions
}


function createSubToolbar(actions: Array<any>) {
    return new Toolbar2({
        actions: actions.map(action => {
            return Toolbar2.Action.extend({
                options: {
                    toolbarIcon: {
                        html: 'test'
                    }
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