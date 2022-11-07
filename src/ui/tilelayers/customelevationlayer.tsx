import { TopoLayer, TopoLayerOptions } from 'leaflet-topography'
import { useRef, useState } from 'react'
import { asyncOperation, createMapboxTerrainAttribution, workers, getMaxWorkers } from '../../util'
import { getMap } from '../structurecontroller'
import { getElevation } from '../../topoutil'


const breakpoints = [0, 150, 250, 350, 500]
function updateBreakpoint(i: number, value: number) {
    breakpoints[i] = value
    layer.redraw()
}


const layer = new TopoLayer({
    attribution: 'Topography by Seth "slutske22" Lutske, ' + createMapboxTerrainAttribution(),
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
                updateBreakpoint(0, value)
        }, {
            name: 'Green',
            value: breakpoints[1],
            update: (value: number) =>
                updateBreakpoint(1, value)
        }, {
            name: 'Blue',
            value: breakpoints[2],
            update: (value: number) =>
                updateBreakpoint(2, value)
        }, {
            name: 'Red',
            value: breakpoints[3],
            update: (value: number) =>
                updateBreakpoint(3, value)
        }, {
            name: 'White',
            value: breakpoints[4],
            update: (value: number) =>
                updateBreakpoint(4, value)
        }]}
    />
)


// TODO: Ability to change the slider value range.
function CustomLayerOptions(props: any) {
    const sliders = new Array<React.MutableRefObject<HTMLInputElement>>()
    const values = new Array<React.MutableRefObject<HTMLInputElement>>()
    function updateElementValues() {
        for (let i = 0; i < breakpoints.length; i++)
            sliders[i].current.value = values[i].current.value = String(breakpoints[i])
    }
    const elements = new Array<JSX.Element>()
    let i = 0
    for (const p of props.breakpoints) {
        const sliderRef = useRef<HTMLInputElement>()
        const valueRef = useRef<HTMLInputElement>()
        sliders.push(sliderRef)
        values.push(valueRef)
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

    const fitToViewRef = useRef<HTMLButtonElement>()
    const [progText, setProgText] = useState('Fit to View')
    return (
        <div className='lc-3xgrid'>
            <p>Colors:</p>
            {elements}
            <button
                ref={fitToViewRef}
                onClick={() => {
                    fitToViewRef.current.setAttribute('disabled', '')
                    fitToView((state: number) => {
                        if (state < 1) setProgText(`Progress: ${Math.round(state * 100)}%.`)
                        else {
                            setProgText('Fit to View')
                            fitToViewRef.current.removeAttribute('disabled')
                        }
                    }, updateElementValues)
                }}
            >{progText}</button>
        </div>
    )
}


function fitToView(progressFunction: (state: number) => any, done: Function) {
    const latlngs = new Array<LatLng>()
    const map = getMap()
    const zoom = map.getZoom()
    const bounds = map.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    const steps = 10
    const lngStep = (ne.lng - sw.lng) / steps
    const latStep = (ne.lat - sw.lat) / steps
    let lng = sw.lng + lngStep / 2

    while (lng < ne.lng) {
        let lat = sw.lat + latStep / 2
        while (lat < ne.lat) {
            latlngs.push({ lat, lng })
            lat += latStep
        }
        lng += lngStep
    }

    const check = asyncOperation(latlngs.length, undefined, postGet)

    let i = 0
    const elevations = new Array<number>()
    workers(latlngs, async (latlng: LatLng) => {
        elevations.push(await getElevation(latlng, zoom))
        progressFunction(++i / latlngs.length)
        check()
    }, getMaxWorkers())

    function postGet() {
        let sum = elevations[0], min = sum, max = sum
        for (let i = 1; i < elevations.length; i++) {
            const temp = elevations[i]
            sum += temp
            if (temp < min) min = temp
            if (temp > max) max = temp
        }
        const avg = sum / elevations.length
        scaleBreakpoints(min, max, avg, 75)

        done()
        layer.redraw()
    }
}


function scaleBreakpoints(min: number, max: number, avg: number, pad: number) {
    const arr = breakpoints
    const range = max - min
    const step = range / (arr.length - 1)

    for (let i = 0; i < arr.length; i++)
        arr[i] = Math.round(min + (step * i))

    arr[0] = Math.round(Math.max(arr[0] - pad, 0))
    arr[arr.length - 1] = Math.round(arr[arr.length - 1] + pad)

    for (let i = 1; i < arr.length - 1; i++)
        arr[i] = Math.round(arr[i] + (avg - arr[i]) * 0.25)
}


export default layer