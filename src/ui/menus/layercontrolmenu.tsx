import { Map as LMap, Control, control, Util, DomUtil, DomEvent } from 'leaflet'
import { createRoot } from 'react-dom/client'
import { LayerControl } from '../components/layercontrol';


(control as any).layerControl = function (layers: any, options: any) {
    return new (Control as any).LayerControl(layers, options)
};

(Control as any).LayerControl = Control.extend({
    options: {
        position: 'topright',
        label: 'Layer Control'
    },

    initialize: function (layers: any, options: any) {
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
