import * as L from 'leaflet'
import { createMapboxTerrainAttribution } from '../util'
import options from '../../options'
import { TopoLayer, TopoLayerOptions } from 'leaflet-topography'
import { useRef } from 'react'


const customElevationLayerBreakpoints = [0, 150, 250, 350, 500];

const customElevationLayer = new TopoLayer({
    attribution: createMapboxTerrainAttribution('Leaflet-topography (Slutse22) | '),
    bounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
    noWrap: true,
    topotype: 'elevation',
    customization: {
        colors: ['#000000', '#00ff00', '#0000ff', '#ff0000', '#ffffff'],
        breakpoints: customElevationLayerBreakpoints,
        breaksAt0: false,
        continuous: true
    }
} as TopoLayerOptions)


const tileLayers = {
    'OSM': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        bounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
        noWrap: true
    }),
    'Mapbox:Terrain-DEM-v1': L.tileLayer(`https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/{z}/{x}/{y}.pngraw?access_token=${options.mapboxToken}`, {
        attribution: createMapboxTerrainAttribution('Terrain-DEM-v1'),
        bounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
        noWrap: true
    } as L.TileLayerOptions),
    'Topography:Elevation': customElevationLayer
}


function updateCustomElevationLayerBreakpoints(i: number, value: number) {
    customElevationLayerBreakpoints[i] = value
    customElevationLayer.redraw()
}

(customElevationLayer as any).options.lcOptions = (
    <CustomElevationLayerOptions
        min={0}
        max={500}
        breakpoints={[{
            name: 'Black',
            value: customElevationLayerBreakpoints[0],
            update: (value: number) =>
                updateCustomElevationLayerBreakpoints(0, value)
        }, {
            name: 'Green',
            value: customElevationLayerBreakpoints[1],
            update: (value: number) =>
                updateCustomElevationLayerBreakpoints(1, value)
        }, {
            name: 'Blue',
            value: customElevationLayerBreakpoints[2],
            update: (value: number) =>
                updateCustomElevationLayerBreakpoints(2, value)
        }, {
            name: 'Red',
            value: customElevationLayerBreakpoints[3],
            update: (value: number) =>
                updateCustomElevationLayerBreakpoints(3, value)
        }, {
            name: 'White',
            value: customElevationLayerBreakpoints[4],
            update: (value: number) =>
                updateCustomElevationLayerBreakpoints(4, value)
        }]}
    />
)


function CustomElevationLayerOptions(props: any) {
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


export {
    tileLayers
}