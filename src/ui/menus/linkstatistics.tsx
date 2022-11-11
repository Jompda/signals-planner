import { CircleMarker, DomEvent, DomUtil, Map as LMap } from 'leaflet'
import { createRoot } from 'react-dom/client'
import Link from '../../struct/link'
import { createDialog } from '../../util'
import LinkLayer from '../components/linklayer'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartEvent,
} from 'chart.js'
import * as helpers from 'chart.js/helpers'
import { Chart } from 'react-chartjs-2'
import { useRef } from 'react'
import { createLosGetter } from '../../topoutil'


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)


let closeActive: Function


export function showLinkStatistics(map: LMap, linkLayer: LinkLayer) {
    const dialog = createDialog(map, {
        size: [600, 500],
        maxSize: [600, 700],
        minSize: [600, 400],
        anchor: [innerHeight / 2 - 350, 0],
        position: 'topleft',
        initOpen: true,
        onClose: onDialogClose
    })
    if (closeActive) closeActive()
    const closer = closeActive = () => dialog.close()

    const highlight = new CircleMarker(linkLayer.link.unit0.latlng, { radius: 10 }).addTo(map)

    const container = DomUtil.create('div', 'dialog-menu')
    DomEvent.disableClickPropagation(container)
    DomEvent.disableScrollPropagation(container)
    dialog.setContent(container)
    let root = createUI(container)

    linkLayer.on('update', onLinkUpdate)
    linkLayer.on('remove', onLinkRemove)

    function onLinkUpdate() {
        console.log('update link')
        root.unmount()
        root = createUI(container)
        highlight.setLatLng(linkLayer.link.unit0.latlng)
    }
    function onLinkRemove() {
        dialog.close()
    }
    function onDialogClose() {
        linkLayer.off('update', onLinkUpdate)
        linkLayer.off('remove', onLinkRemove)
        highlight.remove()
        if (closeActive == closer) closeActive = undefined
    }


    function createUI(container: HTMLDivElement) {
        const root = createRoot(container)

        root.render(
            <>
                <h3>{
                    'Link: ' +
                    linkLayer.link.unit0.toHierarchyString() +
                    ' --- ' +
                    linkLayer.link.unit1.toHierarchyString()
                }</h3>
                <LinkStatistics
                    linkLayer={linkLayer}
                    setHighlightLatLng={(latlng: LatLng) =>
                        highlight.setLatLng(latlng)
                    }
                />
            </>
        )

        return root
    }
}


function LinkStatistics(props: any) {
    const { emitterHeight, values, stats } = props.linkLayer.link as Link
    const canvas = DomUtil.create('canvas')
    canvas.width = 600
    canvas.height = 260

    const getLosElevationAtIndex = createLosGetter(
        values[0].elevation + emitterHeight,
        values[values.length - 1].elevation + emitterHeight,
        values.length - 1
    )

    const distanceLabels = new Array<number>()
    const elevations = new Array<number>()
    const treeHeights = new Array<number>()
    const losElevations = [
        values[0].elevation + emitterHeight,
        ...new Array<number>(values.length - 2).fill(null),
        values[values.length - 1].elevation + emitterHeight
    ]
    let dist = 0
    for (let i = 0; i < values.length; i++) {
        distanceLabels.push(Math.round(dist))
        elevations.push(Math.round(values[i].elevation))
        treeHeights.push(Math.round(values[i].treeHeight))
        dist += stats.delta
    }

    const distanceRef = useRef<HTMLTableCellElement>()
    const elevationRef = useRef<HTMLTableCellElement>()
    const treeHeightRef = useRef<HTMLTableCellElement>()
    const sumRef = useRef<HTMLTableCellElement>()
    const losRef = useRef<HTMLTableCellElement>()
    const chartRef = useRef<ChartJS>()
    let mx = 0, my = 0

    function onHover(e: ChartEvent) {
        const chart = chartRef.current
        const canvasPosition = helpers.getRelativePosition(e, chart)

        const dataX = chart.scales.x.getValueForPixel(canvasPosition.x)
        const dataY = chart.scales.y.getValueForPixel(canvasPosition.y)
        if (dataX < 0 || dataX >= values.length || dataY < 0 || canvasPosition.y < chart.scales.y.top) return

        const distance = Math.floor(stats.delta * dataX)
        const sum = elevations[dataX] + treeHeights[dataX]

        mx = chart.scales.x.getPixelForValue(dataX)
        my = chart.scales.y.getPixelForValue(sum)

        chart.render()
        updateInfo(dataX, distance, elevations[dataX], treeHeights[dataX])
    }

    function updateInfo(i: number, distance: number, elevation: number, treeHeight: number) {
        distanceRef.current.textContent = String(distance) + 'm'
        elevationRef.current.textContent = String(elevation) + 'm'
        treeHeightRef.current.textContent = String(treeHeight) + 'm'
        sumRef.current.textContent = String(elevation + treeHeight) + 'm'
        losRef.current.textContent = String(Math.round(getLosElevationAtIndex(i))) + 'm'
        props.setHighlightLatLng(values[i].latlng)
    }

    const plugins = [{
        id: 'mouseFeatureInfo',
        afterDraw: (chart: ChartJS) => {
            const { ctx } = chart
            const xAxis = chart.scales.x, yAxis = chart.scales.y
            ctx.beginPath()
            ctx.moveTo(xAxis.left, my)
            ctx.lineTo(xAxis.right, my)
            ctx.lineWidth = 1
            ctx.strokeStyle = '#0000FF88'
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(mx, yAxis.top)
            ctx.lineTo(mx, yAxis.bottom)
            ctx.lineWidth = 1
            ctx.stroke()
        }
    }]

    return (
        <div>
            <Chart
                ref={chartRef}
                type='bar'
                data={{
                    labels: distanceLabels,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Elevation',
                            data: elevations,
                            backgroundColor: 'gray',
                            barPercentage: 0.6,
                            stack: 'sum'
                        }, {
                            type: 'bar',
                            label: 'Tree height',
                            data: treeHeights,
                            backgroundColor: '#00ff00',
                            barPercentage: 0.2,
                            stack: 'sum'
                        }, {
                            type: 'line',
                            label: 'Line-of-Sight',
                            data: losElevations,
                            pointRadius: 0,
                            pointHitRadius: 0,
                            borderColor: props.linkLayer.options.color,
                            spanGaps: true
                        }
                    ]
                }}
                options={{
                    scales: {
                        x: {
                            ticks: {
                                callback: (i: number) => {
                                    return distanceLabels[i] + 'm'
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value: number) => {
                                    return value + 'm'
                                }
                            }
                        }
                    },
                    events: ['click', 'mousemove'],
                    onHover: onHover
                }}
                plugins={plugins}
            />
            <table className='link-stats'>
                <tbody>
                    <tr>
                        <td>Distance:</td>
                        <td ref={distanceRef}></td>
                    </tr>
                    <tr>
                        <td>Elevation:</td>
                        <td ref={elevationRef}></td>
                    </tr>
                    <tr>
                        <td>Tree height:</td>
                        <td ref={treeHeightRef}></td>
                    </tr>
                    <tr>
                        <td>Sum:</td>
                        <td ref={sumRef}></td>
                    </tr>
                    <tr>
                        <td>Line-of-sight elevation:</td>
                        <td ref={losRef}></td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}