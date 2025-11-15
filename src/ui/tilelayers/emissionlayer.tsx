import { DomUtil, GridLayer, Map as LMap, Coords, LatLngBounds, LatLng, CRS, Point, latLng } from 'leaflet'
import { getTiledata, latlngToTileCoords, latlngToTilePixelCoords } from 'tiledata'
import { getLinks } from '../../struct'
import { getMap } from '../structurecontroller'
import Link from '../../struct/link'
import LatLon from 'geodesy/latlon-spherical'
import { getGeodesicLine, getGeodesicLineStats } from '../../linkutil'
import { getSetting } from '../../settings'
import { useRef } from 'react'
import { getLinePlot } from '../../util'
import { actionEvents } from '../../actionhistory'
import { RadioMediumOptions } from '../../interfaces'
import {
    ComputeDeltaH,
    ITM_AREA_CR_Ex,
    resolveWarnings,
    resolveReturnCode
} from 'itm-webassembly'


/* 
 * Emission layer logic description: (a very naive proof-of-concept implementation)
 * 
 * createTile-method from GridLayer begins loading dem data and stores it with tiledata.
 * Once no more events are being fired (moveend, creataTile, demLoaded) emission calculation begins.
 * 
 * Emission calculation:
 * - Initialize tiledata tiles to include emission data at a possibly lower resolution.
 * - Get visible tiles with map.getBounds and convert NW and SE corners to tile coordinates.
 * - Based on rendering resolution, get border points including their tile coordinates, pixel coordinates on tile and latlng.
 * 
 * - For each Link:
 *   - For both endpoints (Units):
 *     If not in viewbounds skip
 *     - For every border point which is hit by the beam based geodetic directions:
 *       - Figure out unit position as tile coordinates and pixel coordinates inside the tile.
 *       - Begin LOS calculation.
 *       - To estimate geodesic line-of-sight, get a rough geodesic line between the endpoints (Unit and border point).
 *         - Iterate through the given geodesic latlngs and convert them to tilecoords and pixel coords using tiledata functions.
 *           - Use bresenham's line algorithm to connect the pixel coords between tiles.
 *             - Each pixel is part of the LOS calculation.
 * 
 * // TODO: Implement either ITM Area mode or from scratch free-space-loss and radio horizon.
 */


interface CoverageTile {
    coords: Coords,
    bounds: LatLngBounds,
    data: any,
    drawEmission: Function
}
interface BorderPoint {
    tileCoords: TileCoords,
    xp: number,
    yp: number,
    point: Point, // needed?
    latlng: LatLng
}


let scale = 1 / 4, res = 256 * scale
let receiverHeight = getSetting('defaultEmitterHeight') as number


let update = false;
const cache = new Map<number, Map<string, CoverageTile>>()
let timeout = 1000;
let tid: number


function waitFinish(forceUpdate?: boolean) {
    if (tid) clearTimeout(tid)
    tid = setTimeout(() => {
        if (update || forceUpdate) {
            console.time('calculateCoverage')
            calculateEmission()
            console.timeEnd('calculateCoverage')
        }
        update = false
    }, timeout) as unknown as number
}


function calculateEmission() {
    const links = getLinks()
    const map = getMap()
    const viewBounds = map.getBounds()
    const zoom = map.getZoom()
    const zLayer = cache.get(zoom)

    const nwTile = latlngToTileCoords(viewBounds.getNorthWest(), zoom),
        seTile = latlngToTileCoords(viewBounds.getSouthEast(), zoom)

    const borderPoints = getBorderPoints(nwTile, seTile)

    // Initialize / clear emission data
    for (const [coordsStr, obj] of zLayer.entries())
        obj.data.emission = new Int16Array(res*res)

    for (const link of links) {
        if (link.medium.type == 'cable') continue;
        const ll0 = new LatLon(link.unit[0].latlng.lat, link.unit[0].latlng.lng)
        const ll1 = new LatLon(link.unit[1].latlng.lat, link.unit[1].latlng.lng)
        const bearing00 = ll0.initialBearingTo(ll1)
        const bearing10 = ll1.initialBearingTo(ll0)

        // TODO: Instead of viewbounds check if the unit is inside the active tiles
        if (viewBounds.contains(link.unit[0].latlng)) calculateSourceEmission(borderPoints, zLayer, zoom, ll0, link, link.emitterHeight[0], bearing00)
        if (viewBounds.contains(link.unit[1].latlng)) calculateSourceEmission(borderPoints, zLayer, zoom, ll1, link, link.emitterHeight[1], bearing10)
    }

    // Finally draw emission
    for (const [coordsStr, obj] of zLayer.entries())
        if (viewBounds.overlaps(obj.bounds))
            obj.drawEmission()
}


// BUG: zLayer is sometimes undefined.
// Possible scenario when a receiving unitlayer is outside the viewbounds.
function calculateSourceEmission(
    borderPoints: Array<BorderPoint>,
    zLayer: Map<string, CoverageTile>,
    zoom: number,
    ll0: LatLon,
    link: Link,
    emitterheight: number,
    bearing: number
) {
    const latlng0  = latLng(ll0.lat, ll0.lon)
    const srcTileCoords = latlngToTileCoords(latlng0, zoom) // These two functions could be unified
    const srcTileXY = latlngToTilePixelCoords(srcTileCoords, latlng0);
    const srcRawElevation = zLayer.get(`${srcTileCoords.x}|${srcTileCoords.y}|${zoom}`).data['elevation'][srcTileXY.y * 256 + srcTileXY.x]
    const srcElevation = srcRawElevation + emitterheight

    for (const bp of borderPoints) {
        const ll1 = new LatLon(bp.latlng.lat, bp.latlng.lng)
        const bearing1 = ll0.initialBearingTo(ll1);
        const beamWidth = (link.medium as RadioMediumOptions).beamWidthDeg
        const bearingDiff = Math.abs(bearing-bearing1)
        if (beamWidth && bearingDiff > beamWidth) continue;

        const {steps} = getGeodesicLineStats(latlng0, bp.latlng, 10000) // accuracy good enough
        const latlngs = getGeodesicLine(latlng0, bp.latlng, steps)

        // LOS calculation starts here
        let blindRatio = Number.MIN_SAFE_INTEGER, pxDist = 1

        for (let i = 1; i < latlngs.length; ++i) {
            const latlng0 = latlngs[i-1], latlng1 = latlngs[i]
            const tileCoords0 = latlngToTileCoords(latlng0, zoom)
            const xy0 = latlngToTilePixelCoords(tileCoords0, latlng0) // res 256
            const p0 = new Point(Math.floor(tileCoords0.x * res + xy0.x * scale), Math.floor(tileCoords0.y * res + xy0.y * scale)) // scale the grid to the resolution
            const tileCoords1 = latlngToTileCoords(latlng1, zoom)
            const xy1 = latlngToTilePixelCoords(tileCoords1, latlng1)
            const p1 = new Point(Math.floor(tileCoords1.x * res + xy1.x * scale), Math.floor(tileCoords1.y * res + xy1.y * scale))

            const linePlot = getLinePlot(p0.x, p0.y, p1.x, p1.y)
            
            
            for (let j = 1; j < linePlot.length; ++j) { // skip first
                const p = linePlot[j]
                const rx = p.x / res, ry = p.y / res
                const tx = Math.floor(rx), ty = Math.floor(ry) // tile coordinates
                const x = Math.floor(rx % 1 * res), y = Math.floor(ry % 1 * res) // pixel coords on tile
                // LOS increment here
                
                const data = zLayer.get(`${tx}|${ty}|${zoom}`).data
                const dataIndex = Math.round((y / scale) * 256 + (x / scale))
                const elevation = data['elevation'][dataIndex]
                const treeHeight = data['treeHeight'][dataIndex]

                const emissionArr = zLayer.get(`${tx}|${ty}|${zoom}`).data.emission as Int16Array
                
                const hRatio = (elevation + treeHeight - srcElevation) / pxDist
                let value = 1
                // pxDist should be changed to a more valid distancemeter
                if (hRatio >= blindRatio) { // gets direct radiation
                    blindRatio = hRatio
                    value = 2
                } else { // below radiation, receiverHeight might be enough to get radiation
                    if ((elevation + receiverHeight - srcElevation) / pxDist >= blindRatio) value = 2
                }
                const k = y * res + x
                if (emissionArr[k] != 1 || value != 1) emissionArr[k] += value
                ++pxDist
            }
        }
    }
}


function getBorderPoints(nwCoords: TileCoords, seCoords: TileCoords) {
    const borderPoints = new Array<BorderPoint>()

    // top border
    for (let x = nwCoords.x, y = nwCoords.y; x <= seCoords.x; ++x)
        for (let xp = 0, yp = 0; xp < res; ++xp)
            borderPoints.push(cp(x, y, xp, yp))
    // to prevent duplicates
    borderPoints.shift()
    borderPoints.pop()

    // left
    for (let x = nwCoords.x, y = nwCoords.y; y <= seCoords.y; ++y)
        for (let xp = 0, yp = 0; yp < res; ++yp)
            borderPoints.push(cp(x, y, xp, yp))
    borderPoints.pop()

    // right
    for (let x = seCoords.x, y = nwCoords.y; y <= seCoords.y; ++y)
        for (let xp = res-1, yp = 0; yp < res; ++yp)
            borderPoints.push(cp(x, y, xp, yp))
    borderPoints.pop()

    // bottom
    for (let x = nwCoords.x, y = seCoords.y; x <= seCoords.x; ++x)
        for (let xp = 0, yp = res-1; xp < res; ++xp)
            borderPoints.push(cp(x, y, xp, yp))


    function cp(x: number, y: number, xp: number, yp: number) {
        const point = new Point(x * 256 + xp / scale, y * 256 + yp / scale)
        const latlng = CRS.EPSG3857.pointToLatLng(point, nwCoords.z)
        return {
            tileCoords: {x, y, z: nwCoords.z},
            xp,
            yp,
            point,
            latlng
        }
    }

    return borderPoints
}


(GridLayer as any).emissionLayer = GridLayer.extend({
    options: {
        lcOpacity: 0.6,
        lcOptions: <CustomLayerOptions />
    },
    onAdd: function(map: LMap) {
        this._map = map
        map.on('moveend', this.onMoveEnd)
        actionEvents.addEventListener('structureUpdate', this.structureListener)
        GridLayer.prototype.onAdd.call(this, map)
    },

    onRemove: function(map: LMap) {
        map.off('moveend', this.onMoveEnd)
        actionEvents.removeEventListener('structureUpdate', this.structureListener)
        GridLayer.prototype.onRemove.call(this, map)
    },

    moveListener() { waitFinish() },
    structureListener() { waitFinish(true) },

    /**
     * GridLayer expects a HTML element to be returned
     * and the callback to be called asynchronously.
     */
    createTile: function (coords: Coords, callback: Function) {
        const tile = DomUtil.create('canvas', 'leaflet-tile')
        const size = this.getTileSize()
        tile.width = size.x
        tile.height = size.y

        const ctx = tile.getContext('2d')
        drawCoords(ctx, tile, coords)
        if (coords.z > 14) { // MapBox only provides dem data up to zoom level 14.
            const text = 'NO DATA AVAILABLE\nToo zoomed in.'
            ctx.font = '12px Arial'
            ctx.strokeStyle = 'red'
            ctx.lineWidth = 2
            ctx.strokeText(text, 4, 30)
            ctx.fillText(text, 4, 30)
            setTimeout(() => callback(null, tile))
            return tile
        }

        update = true
        waitFinish();

        (async () => {
            try {
                let m = cache.get(coords.z)
                if (!m) cache.set(coords.z, m = new Map())
                m.set(`${coords.x}|${coords.y}|${coords.z}`, {
                    coords,
                    bounds: this._tileCoordsToBounds(coords),
                    data: await getTiledata(coords, ['elevation', 'treeHeight']),
                    drawEmission: () => this.drawEmission(coords, tile)
                })
            }
            catch (e) { console.error(e) }
            finally { waitFinish() }
            callback(null, tile)
        })()

        return tile
    },

    drawEmission: function(coords: TileCoords, tile: HTMLCanvasElement) {
        const emissionData = cache.get(coords.z).get(`${coords.x}|${coords.y}|${coords.z}`).data.emission as Int16Array

        const ctx = tile.getContext('2d')
        ctx.clearRect(0, 0, tile.width, tile.height)

        const s = 1 / scale

        const putpixel = (x: number, y: number) => ctx.fillRect(x, y, s, s)
        for (let x = 0; x < res; ++x) {
            for (let y = 0; y < res; ++y) {
                const value = emissionData[y * res + x]
                if (value == 0) continue
                else if (value == 1) ctx.fillStyle = '#ffff00'
                else if (value >= 2) ctx.fillStyle = '#00ff00'
                putpixel(x * s, y * s)
            }
        }

        drawCoords(ctx, tile, coords)
    }
})


function drawCoords(ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement, coords: TileCoords) {
    ctx.font = '12px Arial'
    ctx.lineWidth = 1
    ctx.strokeStyle = 'black'
    ctx.strokeRect(0, 0, tile.width, tile.height)
    ctx.fillStyle = 'white'
    const coordsText = [coords.x, coords.y, coords.z].join(', ')
    ctx.lineWidth = 2
    ctx.strokeText(coordsText, 4, 12)
    ctx.fillText(coordsText, 4, 12)
}


function CustomLayerOptions() {
    const receiverHeightRef = useRef<HTMLInputElement>()
    const divRef = useRef<HTMLInputElement>()
    const timeoutRef = useRef<HTMLInputElement>()
    const infoRef = useRef<HTMLInputElement>()

    return (
        <div className='lc-custom'>
            <div className='emissionopt-row'>
                <span>Receiver height (m):</span>
                <input
                    ref={receiverHeightRef}
                    type='number'
                    defaultValue={receiverHeight} />
            </div>
            <div className='emissionopt-row'>
                <span>Tile res = 256 / 2^(value):</span>
                <input
                    ref={divRef}
                    type='number'
                    defaultValue={2} />
            </div>
            <div className='emissionopt-row'>
                <span>Update timeout (ms):</span>
                <input
                    ref={timeoutRef}
                    type='number'
                    defaultValue={timeout} />
            </div>
            <button onClick={() => {
                const rec = parseFloat(receiverHeightRef.current.value)
                const div = 2 ** Math.floor(parseFloat(divRef.current.value))
                const tim = parseFloat(timeoutRef.current.value)
                if (isNaN(rec) || isNaN(div) ||isNaN(tim)) return console.error('INVALID VALUE DETECTED')

                receiverHeight = rec
                timeout = tim

                scale = 1 / div
                res = 256 * scale
                infoRef.current.textContent = String(res)
                waitFinish(true)
            }}>Apply</button>
            <hr />
            <span>Resolution: </span>
            <span ref={infoRef}>{res}</span>
        </div>
    )
}
