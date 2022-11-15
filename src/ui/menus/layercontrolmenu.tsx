import { Map as LMap, Control, control, Util, DomUtil, DomEvent } from 'leaflet'
import { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'


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


function LayerControl(props: any) {
    const headerCaretRef = useRef<HTMLElement>()
    const bodyRef = useRef<HTMLDivElement>()

    const layers = new Array<JSX.Element>()
    let firstLayer = true
    for (const layerName in props.layers) {
        //if (firstLayer) props.layers[layerName].addTo(props.map)
        layers.push(
            <LayerModel
                enabled={props.layers[layerName]._map}
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
            <div
                className='lc-header'
                onClick={() => {
                    if ($(bodyRef.current).is(':visible')) {
                        $(bodyRef.current).slideUp()
                        headerCaretRef.current.classList.replace('fa-caret-down', 'fa-caret-right')
                    } else {
                        $(bodyRef.current).slideDown()
                        headerCaretRef.current.classList.replace('fa-caret-right', 'fa-caret-down')
                    }
                }}
            >
                <i
                    ref={headerCaretRef}
                    className='lc-header-caret fa-solid fa-caret-down'
                />
                <div>{props.label}</div>
                <br />
            </div>
            <div
                ref={bodyRef}
                className='lc-body'
            >{layers}</div>
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
                className={'lc-layermodel-head' + (props.enabled ? ' lclayermodel-head-selected' : '')}
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
                <div>
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
                            defaultChecked={props.enabled}
                        />
                        <div className='toggler-slider'>
                            <div className='toggler-knob'></div>
                        </div>
                    </label>
                    <span>{props.layerName}</span>
                </div>
                <i
                    title='Bring to Front'
                    className='lc-bringtofront fa-solid fa-ellipsis'
                    onClick={(e) => {
                        e.stopPropagation()
                        props.layer.bringToFront()
                    }}
                ></i>
            </div>
            <div
                ref={optionsRef}
                className={('hidden')}
            >
                <LayerModelOptions
                    layer={props.layer}
                />
            </div>
        </div>
    )
}


function LayerModelOptions(props: any) {
    const [state, setState] = useState(1)
    const sliderRef = useRef<HTMLInputElement>()

    return (
        <>
            <div className='lc-slider'>
                <span>Opacity:</span>
                <input
                    className='slider'
                    ref={sliderRef}
                    type='range'
                    defaultValue={100}
                    min={0}
                    max={100}
                    onChange={() => {
                        const value = parseInt(sliderRef.current.value) / 100
                        setState(value)
                        props.layer.setOpacity(value)
                    }}
                />
                <span>{state.toFixed(2)}</span>
            </div>
            {
                (typeof props.layer.options.lcOptions) == 'string'
                    ? <div dangerouslySetInnerHTML={{ __html: props.layer.options.lcOptions }}></div>
                    : props.layer.options.lcOptions
            }
        </>
    )
}