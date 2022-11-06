import * as L from 'leaflet'
import { TopoLayer, TopoLayerOptions } from 'leaflet-topography'
import { useRef } from 'react'
import { createMapboxTerrainAttribution } from '../../util';


const breakpoints = [0, 150, 250, 350, 500]
function updateBreakpoints(i: number, value: number) {
    breakpoints[i] = value
    layer.redraw()
}


const layer = new TopoLayer({
    attribution: 'Topography by Seth "slutske22" Lutske, ' + createMapboxTerrainAttribution(),
    bounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
    noWrap: true,
    topotype: 'elevation',
    customization: {
        colors: ['#000000', '#00ff00', '#0000ff', '#ff0000', '#ffffff'],
        breakpoints: breakpoints,
        breaksAt0: false,
        continuous: true
    }
} as TopoLayerOptions);



(layer as any).options.lcOptions = (
    <CustomLayerOptions
        min={0}
        max={500}
        breakpoints={[{
            name: 'Black',
            value: breakpoints[0],
            update: (value: number) =>
                updateBreakpoints(0, value)
        }, {
            name: 'Green',
            value: breakpoints[1],
            update: (value: number) =>
                updateBreakpoints(1, value)
        }, {
            name: 'Blue',
            value: breakpoints[2],
            update: (value: number) =>
                updateBreakpoints(2, value)
        }, {
            name: 'Red',
            value: breakpoints[3],
            update: (value: number) =>
                updateBreakpoints(3, value)
        }, {
            name: 'White',
            value: breakpoints[4],
            update: (value: number) =>
                updateBreakpoints(4, value)
        }]}
    />
)


function CustomLayerOptions(props: any) {
    const elements = new Array<JSX.Element>()
    let i = 0
    for (const p of props.breakpoints) {
        const sliderRef = useRef<HTMLInputElement>()
        const valueRef = useRef<HTMLInputElement>()
        elements.push(<span key={i++}>{p.name}:</span>)
        elements.push(
            <input
                key={i++}
                className='slider'
                ref={sliderRef}
                type='range'
                defaultValue={p.value}
                min={props.min}
                max={props.max}
                onInput={() => valueRef.current.value = sliderRef.current.value}
                onMouseUp={() => p.update(parseInt(sliderRef.current.value))}
            />
        )
        elements.push(
            <input
                key={i++}
                ref={valueRef}
                type='number'
                className='lc-valueinput'
                defaultValue={p.value}
                onChange={() => {
                    sliderRef.current.value = valueRef.current.value || '0'
                    p.update(parseInt(valueRef.current.value) || 0)
                }}
            />
        )
    }

    return (
        <div className='lc-3xgrid'>
            <p>Colors:</p>
            {elements}
        </div>
    )
}


export default layer