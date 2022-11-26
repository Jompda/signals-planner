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



/*
 * Toolbar from scratch
 */


// temp driver code
function createCustomToolbar(map: LMap) {
    const customToolbar = new (Control as any).CustomToolbar([
        new ToolbarItem({
            icon: <i className='fa fa-mouse-pointer' />,
        }),
        new ToolbarCategory({
            icon: 'a2',
            items: [
                new ToolbarItem({
                    icon: 'a4',
                }),
                new ToolbarCategory({
                    icon: <img src={unitlinkicon} />,
                    items: [
                        new ToolbarItem({
                            icon: 'a7',
                        }), new ToolbarItem({
                            icon: 'a8',
                        })
                    ]
                }),
                new ToolbarItem({
                    icon: <img src={unitlinkicon} />,
                })
            ]
        }),
        new ToolbarItem({
            icon: 'a3',
            toggle: false,
        })
    ] as Array<ToolbarItem>) as Control
    customToolbar.addTo(map)
}


interface ToolbarItemOptions {
    icon: string | JSX.Element
    /** Defaults to true */
    toggle?: boolean
    addHooks?: () => void
    removeHooks?: () => void
}


interface ToolbarCategoryOptions extends ToolbarItemOptions {
    items: Array<ToolbarItem>
}


class ToolbarItem {
    public icon: string | JSX.Element
    public toggle: boolean
    constructor(options: ToolbarItemOptions) {
        this.icon = options.icon
        if (typeof this.icon == 'string') this.icon = <span>{this.icon}</span>
        this.toggle = 'toggle' in options ? options.toggle : true
        if (options.addHooks) this.addHooks = options.addHooks
        if (options.removeHooks) this.removeHooks = options.removeHooks
    }
    addHooks() {
        console.log('addHooks', this.icon)
    }
    removeHooks() {
        console.log('removeHooks', this.icon)
    }
}


class ToolbarCategory extends ToolbarItem {
    public items: Array<ToolbarItem>
    constructor(options: ToolbarCategoryOptions) {
        super(options)
        this.items = options.items
    }
    addHooks() { }
    removeHooks() { }
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

        let currentItem: ToolbarItem
        function setSelection(item: ToolbarItem) {
            if (!item.toggle) return item.addHooks()
            if (currentItem) currentItem.removeHooks()
            currentItem = item
            currentItem.addHooks()
        }

        const root = createRoot(container)
        root.render(
            <CustomToolbar
                setSelection={setSelection}
                items={this.items}
            />
        )

        return container
    }
})


function CustomToolbar(props: any) {
    const items = toolbarItemsToJSX(props.items, props.setSelection)

    return (
        <ul className='ctoolbar-category ctoolbar-root'>
            {items}
        </ul>
    )
}


function ToolbarCategoryComponent(props: any) {
    const category: ToolbarCategory = props.category
    const items = toolbarItemsToJSX(category.items, props.setSelection)

    return (
        <>
            <a href="#" className='ctoolbar-category-icon'>
                <label className='fitter'>
                    {props.category.icon}
                </label>
            </a>
            <ul className='ctoolbar-category'>
                {items}
            </ul>
        </>
    )
}


function toolbarItemsToJSX(items: Array<ToolbarItem>, setSelection: (item: ToolbarItem) => any) {
    const elements = new Array<JSX.Element>()
    let i = 0
    for (const item of items as Array<ToolbarItem>) {
        if (item instanceof ToolbarCategory) {
            elements.push(
                <li key={i++}>
                    <ToolbarCategoryComponent
                        setSelection={setSelection}
                        category={item}
                    />
                </li>
            )
        } else {
            elements.push(
                <li key={i++}>
                    <a href="#" onClick={(e) => {
                        if ((e.target as HTMLElement).tagName == 'INPUT') return
                        setSelection(item)
                    }}>
                        <label className='fitter'>
                            {
                                !item.toggle ||
                                <>
                                    <input type="radio" name="ctoolbar-radio" />
                                    <div></div>
                                </>
                            }
                            {item.icon}
                        </label>
                    </a>
                </li>
            )
        }
    }
    return elements
}