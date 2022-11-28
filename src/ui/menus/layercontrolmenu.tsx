import { Map as LMap, Control, control, Util, DomUtil, DomEvent, ControlOptions, Layer } from 'leaflet'
import { createRoot } from 'react-dom/client'
import { LayerControl } from '../components/layercontrol';


control.layerControl = function (layers: Record<string, Layer>, options: ControlOptions) {
    return new Control.LayerControl(layers, options) as Control
}

Control.LayerControl = Control.extend({
    options: {
        position: 'topright',
        label: 'Layer Control'
    },

    initialize: function (layers: Record<string, Layer>, options: ControlOptions) {
        this.layers = layers
        Util.setOptions(this, options)
    },

    onAdd: function (map: LMap) {
        this._map = map
        const container = this._container = DomUtil.create('div', 'layercontrol')
        DomEvent.disableClickPropagation(container)
        DomEvent.disableScrollPropagation(container)

        const root = createRoot(container)
        root.render(
            <LayerControl
                map={map}
                label={this.options.label}
                layers={this.layers}
            />
        )

        return container
    }
})
