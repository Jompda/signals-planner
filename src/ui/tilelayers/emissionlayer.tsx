import { DomUtil, GridLayer, Map as LMap, Coords, LatLngBounds, LatLng, Marker, CRS, Point, latLng, ControlOptions } from 'leaflet'
import { getTiledata, latlngToTileCoords } from 'tiledata'
import { getLinks } from '../../struct';
import { getMap } from '../structurecontroller';
import Link from '../../struct/link';
import LatLon from 'geodesy/latlon-spherical'
import { RadioMedium } from '../../struct/medium';
import { getGeodesicLine, getGeodesicLineStats } from '../../linkutil';
import { getSetting } from '../../settings';
import { useRef } from 'react';


/* 
 * Emission layer logic description:
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
 * // TODO: Implement the following to the LOS calculation algorithm:
 * The LOS calculation must stop once ray length exceeds radio horizon.
 * Energy loss over distance.
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
        console.log('wait finished')
        if (update || forceUpdate) {
            console.time('calculateCoverage')
            calculateEmission()
            console.timeEnd('calculateCoverage')
        }
        update = false
    }, timeout) as unknown as number
}

function onMoveEnd() {
    console.log('moveend:')
    waitFinish()
}

function calculateEmission() {
    const links = getLinks()
    
    const map = getMap()
    const viewBounds = map.getBounds()
    const zoom = map.getZoom()
    const zLayer = cache.get(zoom)

    const nwTile = latlngToTileCoords(viewBounds.getNorthWest(), zoom),
        seTile = latlngToTileCoords(viewBounds.getSouthEast(), zoom)

    console.log('scale,res:', scale, res)
    console.log('links:', links)

    const borderPoints = getBorderPoints(nwTile, seTile)

    // Initialize / clear emission data
    for (const [coordsStr, obj] of zLayer.entries())
        obj.data.emission = new Int16Array(res*res)

    for (const link of links) {
        if (link.medium.type == 'cable') continue;
        const ll0 = new LatLon(link.unit0.latlng.lat, link.unit0.latlng.lng)
        const ll1 = new LatLon(link.unit1.latlng.lat, link.unit1.latlng.lng)

        const bearing00 = ll0.initialBearingTo(ll1)
        const bearing01 = ll0.finalBearingTo(ll1)
        const bearing10 = ll1.initialBearingTo(ll0)
        const bearing11 = ll1.finalBearingTo(ll0)

        //console.log(link)
        //console.log('bearings:', bearing00, bearing01, bearing10, bearing11)

        //console.log(link.lineStats)
        //console.log('link values:', link.values)

        // instead of viewbounds check if it's inside the active tiles?
        if (viewBounds.contains(link.unit0.latlng)) calculateSourceEmission(borderPoints, zLayer, zoom, ll0, link, link.emitterHeight0, bearing00)
        if (viewBounds.contains(link.unit1.latlng)) calculateSourceEmission(borderPoints, zLayer, zoom, ll1, link, link.emitterHeight1, bearing10)
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
    const srcTileCoords = getTileCoords(latlng0, zoom) // These two functions could be unified
    const srcTileXY = getTileXYCoords(srcTileCoords, latlng0);
    const srcRawElevation = getTileDataValue(srcTileCoords, srcTileXY.x, srcTileXY.y, zLayer, 'elevation', 256)
    const srcElevation = srcRawElevation + emitterheight

    //const map = getMap()
    for (const bp of borderPoints) {
        const ll1 = new LatLon(bp.latlng.lat, bp.latlng.lng)
        const bearing1 = ll0.initialBearingTo(ll1);
        const beamWidth = (link.medium as RadioMedium).beamWidth
        const bearingDiff = Math.abs(bearing-bearing1)
        if (beamWidth && bearingDiff > beamWidth) continue;

        const {steps} = getGeodesicLineStats(latlng0, bp.latlng, 10000) // accuracy good enough
        const latlngs = getGeodesicLine(latlng0, bp.latlng, steps)

        // temp visualization
        //for (const temp of latlngs)
        //    new Marker(temp).addTo(map)

        // LOS calculation starts here
        let blindRatio = Number.MIN_SAFE_INTEGER, pxDist = 1

        for (let i = 1; i < latlngs.length; ++i) {
            const latlng0 = latlngs[i-1], latlng1 = latlngs[i]
            const tileCoords0 = getTileCoords(latlng0, zoom)
            const xy0 = getTileXYCoords(tileCoords0, latlng0) // res 256
            const p0 = new Point(Math.floor(tileCoords0.x * res + xy0.x * scale), Math.floor(tileCoords0.y * res + xy0.y * scale)) // scale the grid to the resolution
            const tileCoords1 = getTileCoords(latlng1, zoom)
            const xy1 = getTileXYCoords(tileCoords1, latlng1)
            const p1 = new Point(Math.floor(tileCoords1.x * res + xy1.x * scale), Math.floor(tileCoords1.y * res + xy1.y * scale))

            const linePlot = getLinePlot(p0.x, p0.y, p1.x, p1.y)
            
            
            for (let j = 1; j < linePlot.length; ++j) { // skip first
                const p = linePlot[j]
                const rx = p.x / res, ry = p.y / res
                const tx = Math.floor(rx), ty = Math.floor(ry) // tile coordinates
                const x = Math.floor(rx % 1 * res), y = Math.floor(ry % 1 * res) // xy on tile
                // LOS increment here
                
                const pElevation = getTileDataValue(
                    {x: tx, y: ty, z: zoom},
                    x / scale, // topleft corner of the pixel // TODO center
                    y / scale,
                    zLayer,
                    'elevation',
                    256
                )
                // TODO: Same for treeHeight

                const emissionArr = zLayer.get(`${tx}|${ty}|${zoom}`).data.emission as Int16Array
                //console.log(tx, ty, x, y, pElevation)
                
                const hRatio = (pElevation - srcElevation) / pxDist
                let value = 1
                // NOTE: Consider implementing a Irregular Terrain Model algorithm.
                //console.log('pxDist,srcElevation,pElevation,blindRatio,hRatio:', pxDist, srcElevation, pElevation, blindRatio, hRatio, hRatio >= blindRatio)
                if (hRatio >= blindRatio) { // pxDist should be changed to a more valid distancemeter
                    // gets direct radiation
                    blindRatio = hRatio
                    value = 2
                    //console.log('updated ratio:', srcElevation, pElevation, blindRatio)
                } else {
                    // below radiation, receiverHeight might be enough to get radiation
                    if ((pElevation + receiverHeight - srcElevation) / pxDist >= blindRatio) value = 2
                }
                emissionArr[y * res + x] = value
                ++pxDist
            }
        }
    }
}


function getTileDataValue(
    coords: TileCoords,
    x: number,
    y: number,
    zLayer: Map<string, CoverageTile>,
    dataField: string,
    res: number
) {
    try {
        const data = zLayer.get(`${coords.x}|${coords.y}|${coords.z}`).data[dataField] as Int16Array
        return data[y * res + x]
    } catch (e) {
        console.error(e)
        console.error(coords, x, y, zLayer, dataField, res)
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


/**
 * Utility function from RadioProjekti
 */
function getTileCoords(latlng: LatLng, scale: number) {
    const point = CRS.EPSG3857.latLngToPoint(latlng, scale)
    return {
        x: Math.floor(point.x / 256),
        y: Math.floor(point.y / 256),
        z: scale
    }
}

/**
 * Utility function from RadioProjekti
 * Formerly known as getTileGridCoords
 */
function getTileXYCoords(tileCoords: TileCoords, latlng: LatLng) {
    const point = CRS.EPSG3857.latLngToPoint(latlng, tileCoords.z)
    const xOffset = point.x / 256 - tileCoords.x
    const yOffset = point.y / 256 - tileCoords.y
    const resUnit = 1 / 256
    const x = Math.floor(xOffset / resUnit)
    const y = Math.floor(yOffset / resUnit)
    return { x, y }
}


/**
 * Bresenham's line algorithm
 * Author: Jack Elton Bresenham
 * Date: 22.10.2022
 * Source: https://en.wikipedia.org/wiki/Bresenham's_line_algorithm
 * Modified for context by Joni Rapo 18.7.2024
 */
function getLinePlot(x0: number, y0: number, x1: number, y1: number) {
    const gridPoints = new Array<{x: number, y: number}>()

    const dx = Math.abs(x1 - x0)
    const sx = x0 < x1 ? 1 : -1
    const dy = -Math.abs(y1 - y0)
    const sy = y0 < y1 ? 1 : -1
    let error = dx + dy

    while (true) {
        gridPoints.push({ x: x0, y: y0 })
        if (x0 == x1 && y0 == y1) break
        const e2 = 2 * error
        if (e2 >= dy) {
            if (x0 == x1) break
            error = error + dy
            x0 = x0 + sx
        }
        if (e2 <= dx) {
            if (y0 == y1) break
            error = error + dx
            y0 = y0 + sy
        }
    }

    return gridPoints
}


(GridLayer as any).emissionLayer = GridLayer.extend({
    options: {
        lcOptions: <CustomLayerOptions />
    },
    onAdd: function(map: LMap) {
        this._map = map
        map.on('moveend', onMoveEnd)
        GridLayer.prototype.onAdd.call(this, map)

        // TODO: Hook to actions to update. Also actions need to fire events of addition, undo and redo.
    },

    onRemove: function(map: LMap) {
        map.off('moveend', onMoveEnd)
        GridLayer.prototype.onRemove.call(this, map)
    },

    createTile: function (coords: Coords, callback: Function) {
        const tile = DomUtil.create('canvas', 'leaflet-tile')
        const size = this.getTileSize()
        tile.width = size.x
        tile.height = size.y

        const ctx = tile.getContext('2d')
        // debug outline
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

        //console.log('loading')
        update = true
        waitFinish()

        const loadData = async () => {
            try {
                let m = cache.get(coords.z)
                if (!m) cache.set(coords.z, m = new Map())
                m.set(`${coords.x}|${coords.y}|${coords.z}`, {
                    coords,
                    bounds: this._tileCoordsToBounds(coords),
                    data: await getTiledata(coords, ['elevation']),
                    drawEmission: () => this.drawEmission(coords, tile)
                })
            }
            catch (e) {
                console.error(e)
            }
            finally {
                //console.log('loaded')
                waitFinish()
            }

            callback(null, tile)
        }
        loadData()

        return tile
    },

    // NOTE: At bigger scales is not accurate enough. Consider
    // calculating at a set zoom level and constructing the tiles from there.
    // Also consider leaving out tiles that are not inside lines of sight to prevent loading thousands of tiles.
    drawEmission: function(coords: TileCoords, tile: HTMLCanvasElement) {
        const emissionData = cache.get(coords.z).get(`${coords.x}|${coords.y}|${coords.z}`).data.emission as Int16Array

        const ctx = tile.getContext('2d')
        ctx.clearRect(0, 0, tile.width, tile.height)

        const s = 1 / scale

        const putpixel = (x: number, y: number) => ctx.fillRect(x, y, s, s)
        for (let x = 0; x < res; ++x) {
            for (let y = 0; y < res; ++y) {
                const value = emissionData[y * res + x]
                if (!value) continue
                else if (value == 1) ctx.fillStyle = '#ffff0088'
                else if (value == 2) ctx.fillStyle = '#00ff0088'
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

    // divider = 4, scale = 1 / divider, res = 256 * scale

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
                console.log('div,scale,res:', div, scale, res)
                infoRef.current.textContent = String(res)
                waitFinish(true)
            }}>Apply</button>
            <hr />
            <span>Resolution: </span>
            <span ref={infoRef}>{res}</span>
        </div>
    )
}