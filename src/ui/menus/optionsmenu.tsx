import { Map as LMap, control, Control, DomUtil, Util, DomEvent } from 'leaflet'
import { createRoot } from 'react-dom/client';
import { createDialog } from '../../util';


control.optionsMenu = function (options: any) {
    return new Control.OptionsMenu(options) as Control
};


Control.OptionsMenu = Control.extend({
    options: {
        position: 'topright'
    },

    initialize: function (options: any) {
        Util.setOptions(this, options)
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
        DomEvent.disableClickPropagation(container)
        DomEvent.disableScrollPropagation(container)
        dialog.setContent(container)
        dialog.close()

        const root = createRoot(container)
        root.render(<OptionsMenu />)
    },
})


function OptionsMenu(props: any) {
    return (
        <>
            <h1>Options Menu</h1>
            <hr />
            <div className='grower'></div>
            <div className='dialog-menu-submit'>
                <button onClick={() => props.apply()}>Apply</button>
                <button onClick={() => {
                    console.log('TODO: RESET')
                }}>Restore defaults</button>
            </div>
        </>
    )
}