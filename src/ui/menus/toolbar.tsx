import Tool from '../tool'
import { setActiveTool } from '../toolcontroller'

import 'leaflet-toolbar'
import { Control, DomUtil, Toolbar2, Util, Map as LMap, DomEvent } from 'leaflet'
import { ToolAction } from '../../interfaces'
import { ToolCategory } from '../toolcategory'
import { createRoot } from 'react-dom/client'

import unitlinkicon from '../../assets/unitlink.png'


// TODO: Create a TS API of this https://codepen.io/naveenbhaskar/pen/nBOeBy
export function createSpToolbar(map: L.Map, tools: Array<Tool>, options: any) {
    setActiveTool(tools[0], map)

    const tb = new Toolbar2.Control({
        position: 'topleft',
        actions: toolsToActions(map, tools)
    });

    /*map.on(L.Draw.Event.TOOLBAROPENED, () =>
        tb._ul.firstChild.firstChild.click()
    )*/

    createCustomToolbar(map)

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


// temp driver code
function createCustomToolbar(map: LMap) {
    const customToolbar = new (Control as any).CustomToolbar([
        new ToolbarItem({
            icon: 'a1',
            addHooks: () => console.log('click a1')
        }),
        new ToolbarCategory({
            icon: 'a2',
            items: [
                new ToolbarItem({
                    icon: 'a4',
                    addHooks: () => console.log('click a4')
                }),
                new ToolbarCategory({
                    icon: <img src={unitlinkicon} />,
                    items: [
                        new ToolbarItem({
                            icon: 'a7',
                            addHooks: () => console.log('click a7')
                        }), new ToolbarItem({
                            icon: 'a8',
                            addHooks: () => console.log('click a8')
                        })
                    ]
                }),
                new ToolbarItem({
                    icon: <img src={unitlinkicon} />,
                    addHooks: () => console.log('click a6')
                })
            ]
        }),
        new ToolbarItem({
            icon: 'a3',
            addHooks: () => console.log('click a3')
        })
    ] as Array<ToolbarItem>) as Control
    customToolbar.addTo(map)
}


/*
 * Toolbar from scratch
 */


interface ToolbarItemOptions {
    icon: string | JSX.Element
    addHooks?: () => void
    removeHooks?: () => void
}


interface ToolbarCategoryOptions extends ToolbarItemOptions {
    items: Array<ToolbarItem>
}


class ToolbarItem {
    public icon: string | JSX.Element
    constructor(options: ToolbarItemOptions) {
        this.icon = options.icon
        if (options.addHooks) this.addHooks = options.addHooks
        if (options.removeHooks) this.removeHooks = options.removeHooks
    }
    addHooks() { }
    removeHooks() { }
}


class ToolbarCategory extends ToolbarItem {
    public items: Array<ToolbarItem>
    constructor(options: ToolbarCategoryOptions) {
        super(options)
        this.items = options.items
    }
}


(Control as any).CustomToolbar = Control.extend({
    options: {
        position: 'topleft'
    },

    initialize: function (items: Array<ToolbarItem>, options: any) {
        this.items = items
        Util.setOptions(this, options)
    },

    onAdd: function (map: LMap) {
        this._map = map
        const container = this._container = DomUtil.create('div', 'ctoolbar')
        DomEvent.disableClickPropagation(container)
        DomEvent.disableScrollPropagation(container)

        const root = createRoot(container)
        root.render(
            <CustomToolbar
                items={this.items}
            />
        )

        return container
    }
})


function CustomToolbar(props: any) {
    const items = toolbarItemsToJSX(props.items)

    return (
        <aside className='ctoolbar'>
            <ul className='ctoolbar-category ctoolbar-root'>
                {items}
            </ul>
        </aside>
    )
}


function ToolbarCategoryComponent(props: any) {
    const category: ToolbarCategory = props.category
    const items = toolbarItemsToJSX(category.items)

    return (
        <>
            <a href="#" className='ctoolbar-category-icon'>
                <div className='fitter'>
                    {props.category.icon}
                </div>
            </a>
            <ul className='ctoolbar-category'>
                {items}
            </ul>
        </>
    )
}


function toolbarItemsToJSX(items: Array<ToolbarItem>) {
    const elements = new Array<JSX.Element>()
    let i = 0
    for (const item of items as Array<ToolbarItem>) {
        if (item instanceof ToolbarCategory) {
            elements.push(
                <li key={i++}>
                    <ToolbarCategoryComponent
                        category={item}
                    />
                </li>
            )
        } else {
            elements.push(
                <li key={i++}>
                    <a href="#" onClick={item.addHooks}>
                        <div className='fitter'>
                            {item.icon}
                        </div>
                    </a>
                </li>
            )
        }
    }
    return elements
}