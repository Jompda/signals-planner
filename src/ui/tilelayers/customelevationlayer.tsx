import { TopoLayer, TopoLayerOptions } from 'leaflet-topography'
import { useRef, useState } from 'react'
import { asyncOperation, createMapboxTerrainAttribution, workers, getMaxWorkers } from '../../util'
import { getMap } from '../structurecontroller'
import { getTopographyValues } from '../../topoutil'
import { SourceName } from '../../interfaces'
import { notifications } from '../..'


const _breakpoints = [0, 150, 250, 350, 500]
function updateBreakpoint(i: number, value: number) {
    _breakpoints[i] = value
    layer.redraw()
}


const layer = new TopoLayer({
    attribution: 'Topography by Seth "slutske22" Lutske, ' + createMapboxTerrainAttribution(),
    topotype: 'elevation',
    customization: {
        colors: ['#0000ff', '#ff00ff', '#00ff00', '#ffff00', '#ff0000'],
        breakpoints: _breakpoints,
        breaksAt0: false,
        continuous: true
    }
} as TopoLayerOptions);



(layer as any).options.lcOptions = (
    <CustomLayerOptions
        min={0}
        max={500}
        breakpoints={[{
            name: 'Blue',
            value: _breakpoints[0],
            update: (value: number) =>
                updateBreakpoint(0, value)
        }, {
            name: 'Violet',
            value: _breakpoints[1],
            update: (value: number) =>
                updateBreakpoint(1, value)
        }, {
            name: 'Green',
            value: _breakpoints[2],
            update: (value: number) =>
                updateBreakpoint(2, value)
        }, {
            name: 'Yellow',
            value: _breakpoints[3],
            update: (value: number) =>
                updateBreakpoint(3, value)
        }, {
            name: 'Red',
            value: _breakpoints[4],
            update: (value: number) =>
                updateBreakpoint(4, value)
        }]}
    />
)


// TODO: Ability to change the slider value range.
function CustomLayerOptions({ breakpoints, min, max }: {
    breakpoints: Array<{
        name: string
        value: number
        update: (value: number) => any
    }>
    min: number
    max: number
}) {
    const sliders = new Array<React.MutableRefObject<HTMLInputElement>>()
    const values = new Array<React.MutableRefObject<HTMLInputElement>>()
    function updateElementValues() {
        for (let i = 0; i < _breakpoints.length; i++)
            sliders[i].current.value = values[i].current.value = String(_breakpoints[i])
    }
    const elements = new Array<JSX.Element>()
    let i = 0
    for (const p of breakpoints) {
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
                min={min}
                max={max}
                onInput={() => valueRef.current.value = sliderRef.current.value}
                onMouseUp={() => p.update(parseInt(sliderRef.current.value))}
            />
        )
        // FIXME: buttons changing value doesn't update the value
        elements.push(
            <input
                key={i++}
                ref={valueRef}
                type='number'
                className='lc-valueinput'
                defaultValue={p.value}
                onKeyUp={e => {
                    if (e.key === 'Enter') {
                        sliderRef.current.value = valueRef.current.value || '0'
                        p.update(parseInt(valueRef.current.value) || 0)
                    }
                }}
            />
        )
    }

    return (
        <div className='lc-3xgrid'>
            <p>Colors:</p>
            {elements}
            <FitToViewButton
                callback={updateElementValues}
            />
        </div>
    )
}


function FitToViewButton({ callback }: {
    callback: Function
}) {
    const [btnDisabled, setBtnDisabled] = useState(false)
    const [progText, setProgText] = useState('Fit to View')

    function progressFunction(state: number) {
        if (state < 1) setProgText(`Progress: ${Math.round(state * 100)}%.`)
        else {
            setProgText('Fit to View')
            setBtnDisabled(false)
        }
    }

    return (
        <button
            disabled={btnDisabled}
            onClick={() => {
                if (getMap().getZoom() > 14) return notifications.alert(
                    'Too zoomed in for Fit to View to work.',
                    `Mapbox doesn't provide topography data for this zoom level.`,
                    { timeout: 6000 }
                )
                setBtnDisabled(true)
                fitToView(progressFunction, callback)
            }}
        >{progText}</button>
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
        try {
            const topoValues = await getTopographyValues(['elevation'] as Array<SourceName>, latlng, zoom)
            elevations.push(topoValues[0])
        }
        catch (e) {}
        finally {
            progressFunction(++i / latlngs.length)
            check()
        }
    }, getMaxWorkers())

    function postGet() {
        if (elevations.length == 0) return done()
        let sum = elevations[0], min = sum, max = sum
        for (let i = 1; i < elevations.length; i++) {
            const temp = elevations[i]
            sum += temp
            if (temp < min) min = temp
            if (temp > max) max = temp
        }
        const avg = sum / elevations.length
        scaleBreakpoints(min, max, avg, 0)

        done()
        layer.redraw()
    }
}


function scaleBreakpoints(min: number, max: number, avg: number, pad: number) {
    const arr = _breakpoints
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