import { useRef, useState } from 'react'


export function LayerControl(props: any) {
    const headerCaretRef = useRef<HTMLElement>()
    const bodyRef = useRef<HTMLDivElement>()

    const layers = new Array<JSX.Element>()
    for (const layerName in props.layers) {
        layers.push(
            <LayerModel
                enabled={props.layers[layerName]._map}
                map={props.map}
                key={layerName}
                layerName={layerName}
                layer={props.layers[layerName]}
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
                            // Checked gets changed to the new value before this function is called.
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
                <div
                    title='Bring to Front'
                    className='lc-bringtofront'
                    onClick={(e) => {
                        e.stopPropagation()
                        props.layer.bringToFront()
                    }}
                ><i className='fa-solid fa-ellipsis'></i>
                </div>
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