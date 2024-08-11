import { Map as LMap, control, Control, DomUtil, Util, ControlOptions } from 'leaflet'
import { createRoot } from 'react-dom/client';
import { createDialog } from '../../util';
import { OptionsItem } from '../../interfaces';


control.optionsMenu = function (items: Array<OptionsItem>, options: ControlOptions) {
    return new Control.OptionsMenu(items, options) as Control
};


Control.OptionsMenu = Control.extend({
    options: {
        position: 'topright'
    },

    initialize: function (items: Array<OptionsItem>, options: ControlOptions) {
        Util.setOptions(this, options)
        this._items = items;
        this._container = this.createOpenButton()
    },

    onAdd: function (map: LMap) {
        this._map = map
        this.createDialog()
        return this._container
    },

    createOpenButton: function () {
        const container = DomUtil.create('div', 'optionsmenu-button')
        const root = createRoot(container)
        root.render(
            <i
                className='fa fa-cog'
                onClick={() => this.toggleDialog()}
            ></i>
        )
        return container
    },

    toggleDialog: function () {
        if (this.dialogShowing) {
            this._dialog.close()
            this.dialogShowing = false
        }
        else {
            this._dialog.open()
            this.dialogShowing = true
        }
    },

    createDialog: function () {
        const dialog = this._dialog = createDialog(this._map, {
            size: [600, 500],
            maxSize: [600, 700],
            minSize: [600, 400],
            anchor: [innerHeight / 2 - 300, innerWidth / 2 - 300],
            position: 'topleft',
            destroyOnClose: false
        })

        const container = DomUtil.create('div', 'dialog-menu')

        const items = this._items
        const elements = new Array<React.JSX.Element>
        for (let i = 0; i < this._items.length; ++i)
            elements.push(<div key={i}>{this._items[i].element}</div>)
        
        const root = createRoot(container)

        function applyOptions() {
            for (const item of items) item.apply()
        }

        function resetOptions() {
            for (const item of items) item.reset()
        }

        root.render(
            <>
                <h1>Options</h1>
                <hr />
                {elements}
                <div className='grower'></div>
                <div className='dialog-menu-submit'>
                    <button onClick={applyOptions}>Apply</button>
                    <button onClick={resetOptions}>Restore defaults</button>
                </div>
            </>
        )

        dialog.setContent(container)
        dialog.close()
    },
})
