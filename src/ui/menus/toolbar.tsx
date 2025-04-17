import { Control, DomUtil, Util, Map as LMap, DomEvent, ControlOptions, control } from 'leaflet'
import { IToolbarItem } from '../../interfaces'
import { createRoot } from 'react-dom/client'


control.customToolbar = function (items: Array<IToolbarItem>, options?: ControlOptions) {
    return new Control.CustomToolbar(items, options) as Control
}


export class ToolbarItem {
    public name: string
    public tooltip?: string
    public icon: JSX.Element
    public radio: boolean
    constructor(options: IToolbarItem) {
        this.name = options.name
        this.tooltip = options.tooltip
        this.icon = typeof options.icon == 'string'
            ? <span>{options.icon}</span>
            : options.icon
        this.radio = 'radio' in options ? options.radio : true
        if (options.addHooks) this.addHooks = (map) => options.addHooks(map)
        if (options.removeHooks) this.removeHooks = (map) => options.removeHooks(map)
    }
    addHooks(map: LMap) { }
    removeHooks(map: LMap) { }
}


class ToolbarCategory extends ToolbarItem {
    public items: Array<IToolbarItem>
    constructor(options: IToolbarItem) {
        super(options)
        this.items = options.items
    }
}


(Control as any).CustomToolbar = Control.extend({
    options: {
        position: 'topleft'
    },

    initialize: function (items: Array<IToolbarItem>, options: ControlOptions) {
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
            if (!item.radio) return item.addHooks(map)
            if (currentItem) currentItem.removeHooks(map)
            currentItem = item
            currentItem.addHooks(map)
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


function CustomToolbar({ items, setSelection }: {
    items: Array<IToolbarItem>
    setSelection: (item: ToolbarItem) => any
}) {
    const itemElements = toolbarItemsToJSX(items, setSelection)

    return (
        <ul className='ctoolbar-category ctoolbar-root'>
            {itemElements}
        </ul>
    )
}


function ToolbarCategoryComponent({ category, setSelection }: {
    category: ToolbarCategory
    setSelection: (item: ToolbarItem) => any
}) {
    const items = toolbarItemsToJSX(category.items, setSelection)

    return (
        <>
            <ToolbarRadioButton
                className='ctoolbar-category-icon'
                setSelection={setSelection}
                item={category}
            />
            <ul className='ctoolbar-category'>
                {items}
            </ul>
        </>
    )
}


function toolbarItemsToJSX(items: Array<IToolbarItem>, setSelection: (item: ToolbarItem) => any) {
    const elements = new Array<JSX.Element>()
    let i = 0
    for (const itemOptions of items as Array<IToolbarItem>) {
        const item = itemOptions.items !== undefined
            ? new ToolbarCategory(itemOptions)
            : new ToolbarItem(itemOptions)
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
                    <ToolbarRadioButton
                        setSelection={setSelection}
                        item={item}
                    />
                </li>
            )
        }
    }
    return elements
}


function ToolbarRadioButton({ item, className, setSelection }: {
    className?: string
    item: ToolbarItem
    setSelection: (item: ToolbarItem) => any
}) {
    return (
        <div title={item.tooltip} className={className} onClick={(e) => {
            if ((e.target as HTMLElement).tagName == 'INPUT') return
            setSelection(item)
        }}>
            <label className='fitter'>
                {
                    !item.radio ||
                    <>
                        <input id={'ctoolbar-' + item.name} type="radio" name="ctoolbar-radio" />
                        <div></div>
                    </>
                }
                {item.icon}
            </label>
        </div>
    )
}