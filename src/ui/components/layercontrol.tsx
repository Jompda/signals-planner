import { Map as LMap, TileLayer } from 'leaflet'
import { useRef, useState } from 'react'


export function LayerControl({ layers, map, label }: {
    map: LMap
    layers: Record<string, TileLayer>
    label: string
}) {
    const headerCaretRef = useRef<HTMLElement>()
    const bodyRef = useRef<HTMLDivElement>()

    const layerModels = new Array<JSX.Element>()
    for (const layerName in layers) {
        layerModels.push(
            <LayerModel
                enabled={(layers[layerName] as any)._map}
                map={map}
                key={layerName}
                layerName={layerName}
                layer={layers[layerName]}
            />
        )
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
                    className='lc-header-caret fa fa-caret-down'
                />
                <div>{label}</div>
                <br />
            </div>
            <div
                ref={bodyRef}
                className='lc-body'
            >{layerModels}</div>
        </>
    )
}


function LayerModel({ enabled, layer, map, layerName }: {
    map: LMap
    layerName: string
    layer: TileLayer
    enabled: boolean
}) {
    const headRef = useRef<HTMLDivElement>()
    const checkboxRef = useRef<HTMLInputElement>()
    const optionsRef = useRef<HTMLDivElement>()
    return (
        <div className='lc-layermodel'>
            <div
                ref={headRef}
                className={'lc-layermodel-head' + (enabled ? ' lc-layermodel-head-selected' : '')}
                onClick={() => {
                    if ($(optionsRef.current).is(':visible')) {
                        $(optionsRef.current).slideUp()
                        headRef.current.classList.remove('lc-layermodel-head-selected')
                    } else {
                        $(optionsRef.current).slideDown()
                        headRef.current.classList.add('lc-layermodel-head-selected')
                    }
                }}
            >
                <div>
                    <label
                        className='toggler-wrapper'
                        onClick={(e) => {
                            e.stopPropagation()
                            // Checked gets changed to the new value before this function is called.
                            !checkboxRef.current.checked
                                ? layer.remove()
                                : layer.addTo(map)
                        }}
                    >
                        <input
                            ref={checkboxRef}
                            type='checkbox'
                            defaultChecked={enabled}
                        />
                        <div className='toggler-slider'>
                            <div className='toggler-knob'></div>
                        </div>
                    </label>
                    <span>{layerName}</span>
                </div>
                <div
                    title='Bring to Front'
                    className='lc-bringtofront'
                    onClick={(e) => {
                        e.stopPropagation()
                        layer.bringToFront()
                    }}
                ><i className='fa fa-ellipsis'></i>
                </div>
            </div>
            <div
                ref={optionsRef}
                className={enabled ? 'visible' : 'hidden'}
            >
                <LayerModelOptions
                    layer={layer}
                />
            </div>
        </div>
    )
}


function LayerModelOptions({ layer }: {
    layer: TileLayer & { options: { lcOpacity?: number, lcOptions?: any } }
}) {
    const [opacity, setOpacity] = useState(layer.options.lcOpacity ? layer.options.lcOpacity : 1)
    layer.setOpacity(opacity)
    const opacitySliderRef = useRef<HTMLInputElement>()

    return (
        <>
            <div className='lc-slider'>
                <span>Opacity:</span>
                <input
                    className='slider'
                    ref={opacitySliderRef}
                    type='range'
                    defaultValue={layer.options.lcOpacity ? layer.options.lcOpacity * 100 : 100}
                    min={0}
                    max={100}
                    onChange={() => {
                        const value = parseInt(opacitySliderRef.current.value) / 100
                        setOpacity(value)
                        layer.setOpacity(value)
                    }}
                />
                <span>{opacity.toFixed(2)}</span>
            </div>
            {
                (typeof layer.options.lcOptions) == 'string'
                    ? <div dangerouslySetInnerHTML={{ __html: layer.options.lcOptions }}></div>
                    : layer.options.lcOptions
            }
        </>
    )
}