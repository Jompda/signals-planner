import * as L from 'leaflet'
import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client'
import options from '../../options';


(L as any).layerControl = function (layers: any, options: any) {
    return new (L.Control as any).LayerControl(layers, options)
};

(L.Control as any).LayerControl = L.Control.extend({
    options: {
        position: 'topright',
        label: 'Layer Control'
    },

    initialize: function (layers: any, options: any) {
        this.layers = layers
        L.Util.setOptions(this, options)
    },

    onAdd: function (map: L.Map) {
        this._map = map
        const container = this._container = L.DomUtil.create('div', 'layercontrol')
        L.DomEvent.disableClickPropagation(container)
        L.DomEvent.disableScrollPropagation(container)

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


function LayerControl(props: any) {
    const layers = new Array<JSX.Element>()
    let firstLayer = true
    for (const layerName in props.layers) {
        if (firstLayer) props.layers[layerName].addTo(props.map)
        layers.push(
            <LayerModel
                hidden={!firstLayer}
                map={props.map}
                key={layerName}
                layerName={layerName}
                layer={props.layers[layerName]}
            />
        )
        firstLayer = false
    }
    return (
        <>
            <h2>{props.label}</h2>
            <div>{layers}</div>
        </>
    )
}


function LayerModel(props: any) {
    const headRef = useRef<HTMLDivElement>()
    const checkboxRef = useRef<HTMLInputElement>()
    const optionsRef = useRef<HTMLDivElement>()
    return (
        <div className='lc-layermodel'>
            <div
                ref={headRef}
                className={'lc-layermodel-head' + (props.hidden ? '' : ' lclayermodel-head-selected')}
                onClick={() => {
                    if ($(optionsRef.current).is(':visible')) {
                        $(optionsRef.current).slideUp()
                        headRef.current.classList.remove('lclayermodel-head-selected')
                    } else {
                        $(optionsRef.current).slideDown()
                        headRef.current.classList.add('lclayermodel-head-selected')
                    }
                }}
            >
                <label
                    className='toggler-wrapper'
                    onClick={(e) => {
                        e.stopPropagation()
                        // Checked get changed to the new value before this function is called.
                        !checkboxRef.current.checked
                            ? props.layer.remove()
                            : props.layer.addTo(props.map)
                    }}
                >
                    <input
                        ref={checkboxRef}
                        type='checkbox'
                        defaultChecked={!props.hidden}
                    />
                    <div className='toggler-slider'>
                        <div className='toggler-knob'></div>
                    </div>
                </label>
                <div>
                    <span>{props.layerName}</span>
                    <i className='fa-solid fa-ellipsis'></i>
                </div>
            </div>
            <div
                ref={optionsRef}
                className={'lc-layermodel-body' + (props.hidden ? ' hidden' : '')}
            >Options</div>
        </div>
    )
}


