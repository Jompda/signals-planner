import { DomUtil, LatLng } from 'leaflet'
import Link from '../../struct/link'
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
import { getRelativePosition } from 'chart.js/helpers'
import { Chart } from 'react-chartjs-2'
import { useRef } from 'react'
import { createLosGetter } from '../../linkutil'
import LinkLayer from './linklayer'


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


export function LinkStatistics({ linkLayer, setHighlightLatLng }: {
    linkLayer: LinkLayer
    setHighlightLatLng: (latlng: LatLng) => any
}) {
    const { emitterHeight, values, lineStats, stats, medium } = linkLayer.link as Link
    const canvas = DomUtil.create('canvas')
    canvas.width = 600
    canvas.height = 260

    const getLosElevationAtIndex = createLosGetter(
        values[0].elevation + emitterHeight[0],
        values[values.length - 1].elevation + emitterHeight[1],
        values.length - 1
    )

    const distanceLabels = new Array<number>()
    const elevations = new Array<number>()
    const treeHeights = new Array<number>()
    const losElevations = medium.type === 'radio' ? [
        values[0].elevation + emitterHeight[0],
        ...new Array<number>(values.length - 2).fill(null),
        values[values.length - 1].elevation + emitterHeight[1]
    ] : values.map(a => a.elevation)
    let dist = 0
    for (let i = 0; i < values.length; i++) {
        distanceLabels.push(Math.round(dist))
        elevations.push(Math.round(values[i].elevation))
        treeHeights.push(Math.round(values[i].treeHeight))
        dist += lineStats.delta
    }

    const positionRef = useRef<HTMLTableCellElement>()
    const elevationRef = useRef<HTMLTableCellElement>()
    const treeHeightRef = useRef<HTMLTableCellElement>()
    const sumRef = useRef<HTMLTableCellElement>()
    const losRef = useRef<HTMLTableCellElement>()
    const chartRef = useRef<ChartJS>()
    let mx = 0, my = 0

    function onHover(e: ChartEvent) {
        const chart = chartRef.current
        const canvasPosition = getRelativePosition(e, chart)

        const dataX = chart.scales.x.getValueForPixel(canvasPosition.x)
        const dataY = chart.scales.y.getValueForPixel(canvasPosition.y)
        if (dataX < 0 || dataX >= values.length || dataY < 0 || canvasPosition.y < chart.scales.y.top) return

        const distance = Math.floor(lineStats.delta * dataX)
        const sum = elevations[dataX] + treeHeights[dataX]

        mx = chart.scales.x.getPixelForValue(dataX)
        my = chart.scales.y.getPixelForValue(sum)

        chart.render()
        updateInfo(dataX, distance, elevations[dataX], treeHeights[dataX])
    }

    function updateInfo(i: number, distance: number, elevation: number, treeHeight: number) {
        positionRef.current.textContent = String(distance) + 'm'
        elevationRef.current.textContent = String(elevation) + 'm'
        treeHeightRef.current.textContent = String(treeHeight) + 'm'
        sumRef.current.textContent = String(elevation + treeHeight) + 'm'
        losRef.current.textContent = String(Math.round(getLosElevationAtIndex(i))) + 'm'
        setHighlightLatLng(values[i].latlng)
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

    const warnings = 'warnings' in stats ? stats.warnings.map((a, i) => <tr key={i}><td>{a}</td></tr>) : undefined

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
                            label: medium.type === 'radio' ? 'Line-of-Sight' : 'Cable',
                            data: losElevations,
                            pointRadius: 0,
                            pointHitRadius: 0,
                            borderColor: linkLayer.line.options.color,
                            spanGaps: true
                        }
                    ]
                }}
                options={{
                    animation: {
                        duration: 0
                    },
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
            <br />
            <table className='link-stats'>
                <tbody>
                    <tr>
                        <td>Distance</td>
                        <td>{Math.round(lineStats.distance)}m</td>
                    </tr>
                    {'A__db' in stats
                        ? <>
                            <tr>
                                <td>A_fs__db</td>
                                <td>{Math.round(stats.A_fs__db)}dB</td>
                            </tr>
                            <tr>
                                <td>A_ref__db</td>
                                <td>{Math.round(stats.A_ref__db)}dB</td>
                            </tr>
                            <tr>
                                <td>A__db</td>
                                <td>{Math.round(stats.A__db)}dB</td>
                            </tr>
                            <tr>
                                <td>mode</td>
                                <td>{stats.mode}</td>
                            </tr>
                            <tr>
                                <td>Emitter height 0</td>
                                <td>{emitterHeight[0]}m</td>
                            </tr>
                            <tr>
                                <td>Emitter height 1</td>
                                <td>{emitterHeight[1]}m</td>
                            </tr>
                        </>
                        : undefined
                    }
                    {'cables' in stats
                        ? <>
                            <tr>
                                <td>Cables</td>
                                <td>{stats.cables}</td>
                            </tr>
                            <tr>
                                <td>Length</td>
                                <td>{stats.length}m</td>
                            </tr>
                        </>
                        : undefined
                    }
                </tbody>
            </table>
            <table className='link-stats'>
                <tbody>
                    <tr>
                        <td>Position</td>
                        <td ref={positionRef}></td>
                    </tr>
                    <tr>
                        <td>Elevation</td>
                        <td ref={elevationRef}></td>
                    </tr>
                    <tr>
                        <td>Tree height</td>
                        <td ref={treeHeightRef}></td>
                    </tr>
                    <tr>
                        <td>Sum</td>
                        <td ref={sumRef}></td>
                    </tr>
                    <tr>
                        <td>Line-of-sight elevation</td>
                        <td ref={losRef}></td>
                    </tr>
                </tbody>
            </table>
            {warnings
                ? <table className='link-stats link-stats-warnings'>
                    <tbody>
                        <tr><td>Warnings:</td></tr>
                        {warnings}
                    </tbody>
                </table>
                : undefined
            }
        </div>
    )
}