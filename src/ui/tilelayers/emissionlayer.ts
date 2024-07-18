import { DomUtil, GridLayer, Map as LMap, Coords, LatLngBounds, LatLng, Marker, CRS, Point } from 'leaflet'
import { getTiledata, latlngToTileCoords, latlngToXYOnTile, tileCoordsToPoint } from 'tiledata'
import { tileDataStorage } from '../..'
import { getLinks } from '../../struct';
import { getMap } from '../structurecontroller';
import Unit from '../../struct/unit';
import Link from '../../struct/link';
import LatLon from 'geodesy/latlon-ellipsoidal-vincenty'


/* // NOTE: EmissionLayer planning below:
 * Extend GridLayer:
 * To limit the covered area, the layer must take a bounds option.
 *   Use OSM:s slippy tiles function to get the covered tiles' coordinates at certain zoom level.
 * By default the layer draws an outline on the selected tiles.
 *   If emission data exists in the data structure then draw it.
 * Emission calculaton for the current zoom level is triggered with a function.
 *   After the calculation is finished, redraw the layer.
 * 
 * Emission calculation:
 * Create a huge raster from all covered tiles.
 * For each Link:
 *   For both endpoints (Units):
 *     Unit position can be acquired by using functions latlngToTilecoords and latlngToXYOnTile from tiledata.
 *     Get every possible ray by getting the line paths with Bresenham's line algorithm from Unit to raster edge pixel.
 *       I know it's only an approximation of the path since it doesn't take the geodesic path into account but the
 *       paths don't really differ that much at short ranges.
 *       It'd be too much for me to try to approximate the geodesic line path on a raster while covering every single pixel.
 *     If beam width is specified then filter out rays that are outside the beam.
 *       Take into account sidebeams / bad directivity?
 *       Simulate directivity by creating rays with varying strengths?
 *         Would be yet another field of science which I'm not familliar with.
 *     The ray length must be limited at max to radio horizon.
 *     Find a way to transform a tilepixel to LatLng.
 *       Maybe go create that function in the tiledata library?
 */


interface CoverageTile {
    coords: Coords,
    bounds: LatLngBounds,
    data: any,
    drawEmission: Function
}


const scale = 1 / 16, res = 256 * scale


let update = false;
const cache = new Map<number, Map<string, CoverageTile>>()
const timeout = 1000;
let tid: number


function waitFinish() {
    if (tid) clearTimeout(tid)
    tid = setTimeout(() => {
        console.log('wait finished')
        if (update) {
            console.time('calculateCoverage')
            calculateCoverage()
            console.timeEnd('calculateCoverage')
        }
        update = false
    }, timeout) as unknown as number
}

function onMoveEnd() {
    console.log('moveend:')
    waitFinish()
}

/**
 * // NOTE: Ota huomioon geodeettinen los linja.
 */
function calculateCoverage() {
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
    console.log('borderpoints:', borderPoints.length)

    // Initialize / clear emission data
    for (const [coordsStr, obj] of zLayer.entries()) {
        obj.data.emission = new Int16Array(res*res)
        //console.log(coordsStr, viewBounds.overlaps(obj.bounds))
        //obj.drawEmission()
    }

    for (const link of links) {
        const ll0 = new LatLon(link.unit0.latlng.lat, link.unit0.latlng.lng)
        const ll1 = new LatLon(link.unit1.latlng.lat, link.unit1.latlng.lng)

        const bearing00 = ll0.initialBearingTo(ll1)
        const bearing01 = ll0.finalBearingTo(ll1)
        const bearing10 = ll1.initialBearingTo(ll0)
        const bearing11 = ll1.finalBearingTo(ll0)

        //console.log(link)
        //console.log('bearings:', bearing00, bearing01, bearing10, bearing11)

        //console.log(link.lineStats)
        console.log('link values:', link.values)

        // instead of viewbounds check if it's inside the active tiles?
        if (viewBounds.contains(link.unit0.latlng)) calculateEmission(ll0, link, bearing00)
        if (viewBounds.contains(link.unit1.latlng)) calculateEmission(ll1, link, bearing10)
    }

    function calculateEmission(ll0: LatLon, link: Link, bearing: number) {
        for (const temp of borderPoints) {
            const ll1 = new LatLon(temp.latlng.lat, temp.latlng.lng)
            const bearing1 = ll0.initialBearingTo(ll1);
            if (Math.abs(bearing-bearing1) < 3) {
                new Marker([ll1._lat, ll1.lon]).addTo(getMap())
            }
        }
    }
}


function getBorderPoints(nwCoords: TileCoords, seCoords: TileCoords) {
    const borderPoints: {
        tileCoords: TileCoords,
        xp: number,
        yp: number,
        point: Point, // needed?
        latlng: LatLng
    }[] = []

    // top border
    for (let x = nwCoords.x, y = nwCoords.y; x <= seCoords.x; ++x)
        for (let xp = 0, yp = 0; xp < res; ++xp)
            borderPoints.push(cp(x, y, xp, yp))

    // left // TODO: don't create top and bottom pixels
    for (let x = nwCoords.x, y = nwCoords.y; y <= seCoords.y; ++y)
        for (let xp = 0, yp = 0; yp < res; ++yp)
            borderPoints.push(cp(x, y, xp, yp))

    // right // TODO: don't create top and bottom pixels
    for (let x = seCoords.x, y = nwCoords.y; y <= seCoords.y; ++y)
        for (let xp = res-1, yp = 0; yp < res; ++yp)
            borderPoints.push(cp(x, y, xp, yp))

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
 */
function getTileGridCoords(tileCoords: TileCoords, latlng: LatLng) {
    const point = CRS.EPSG3857.latLngToPoint(latlng, tileCoords.z)
    const xOffset = point.x / 256 - tileCoords.x
    const yOffset = point.y / 256 - tileCoords.y
    const resUnit = 1 / 256
    const x = Math.floor(xOffset / resUnit)
    const y = Math.floor(yOffset / resUnit)
    return { x, y }
}


(GridLayer as any).emissionLayer = GridLayer.extend({
    onAdd: function(map: LMap) {
        //this._map = map
        map.on('moveend', onMoveEnd)
        GridLayer.prototype.onAdd.call(this, map)
    },

    onRemove: function(map: LMap) {
        map.off('moveend', onMoveEnd)
        GridLayer.prototype.onRemove.call(this, map)
    },

    createTile: function (coords: Coords, callback: Function) {
        //console.log('loading')
        update = true
        waitFinish()
        const tile = DomUtil.create('canvas', 'leaflet-tile')
        const size = this.getTileSize()
        tile.width = size.x
        tile.height = size.y

        const loadData = async () => {
            // debug outline
            const ctx = tile.getContext('2d')
            ctx.font = '12px Arial'
            ctx.lineWidth = 1
            ctx.strokeStyle = 'black'
            ctx.strokeRect(0, 0, tile.width, tile.height)
            ctx.fillStyle = 'white'
            const coordsText = [coords.x, coords.y, coords.z].join(', ')
            ctx.lineWidth = 2
            ctx.strokeText(coordsText, 4, 12)
            ctx.fillText(coordsText, 4, 12)

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
                callback(null, tile)
            }
        }
        loadData()

        return tile
    },

    drawEmission: function(coords: TileCoords, tile: HTMLCanvasElement) {
        const ctx = tile.getContext('2d')

        // temp to illustrate emission draw has been called
        const size = 256
        ctx.clearRect(size/4, size/4, tile.width / 2, tile.height / 2)
        ctx.fillStyle = '#00ff0088'
        ctx.fillRect(size/4, size/4, tile.width / 2, tile.height / 2)
    }
})
