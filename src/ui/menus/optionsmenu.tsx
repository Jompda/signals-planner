import { Map as LMap, control, Control, DomUtil, Util, ControlOptions } from 'leaflet'
import { createRoot } from 'react-dom/client'
import { createDialog } from '../../util'
import { useRef, useState } from 'react'
import { getSetting, resetSetting, setSetting } from '../../settings'


control.optionsMenu = function (options: ControlOptions) {
    return new Control.OptionsMenu(options) as Control
}


Control.OptionsMenu = Control.extend({
    options: {
        position: 'topright'
    },

    initialize: function (options: ControlOptions) {
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

        const root = createRoot(container)
        root.render(<OptionsMenu/>)

        dialog.setContent(container)
        dialog.close()
    },
})


function OptionsMenu() {
    const emitterHeightRef = useRef<HTMLInputElement>()
    const [emitterHeight, setEmitterHeight] = useState(getSetting('defaultEmitterHeight'))

    function apply() {
        setSetting('defaultEmitterHeight', emitterHeight)
    }
    function reset() {
        resetSetting('defaultEmitterHeight')
        const value = getSetting('defaultEmitterHeight', undefined, true)
        setEmitterHeight(emitterHeightRef.current.value = value)
    }

    return <>
        <h1>Mediums</h1>
        <h2>Default emitter height</h2>
        <input type="number" defaultValue={emitterHeight} ref={emitterHeightRef}
            onChange={() => setEmitterHeight(parseFloat(emitterHeightRef.current.value))}/>
        <div className='grower'></div>
        <div className='dialog-menu-submit'>
            <button onClick={apply}>Apply</button>
            <button onClick={reset}>Restore defaults</button>
        </div>
    </>
}
