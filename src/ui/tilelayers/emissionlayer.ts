import { DomUtil, GridLayer, Map as LMap, Coords, LatLngBounds } from 'leaflet'
import { angle } from 'leaflet-geometryutil'
import { getTiledata, latlngToTileCoords } from 'tiledata'
import { tileDataStorage } from '../..'
import { getLinks } from '../../struct';
import { getMap } from '../structurecontroller';
import Unit from '../../struct/unit';
import Link from '../../struct/link';


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


const res = 256/4


let update = false;
const cache = new Map<number, Map<string, CoverageTile>>()
const timeout = 1000;
let tid: number


function waitFinish() {
    if (tid) clearTimeout(tid)
    tid = setTimeout(() => {
        console.log('wait finished')
        if (update) calculateCoverage()
        update = false
    }, timeout) as unknown as number
}

function onMoveEnd() {
    console.log('moveend:')
    waitFinish()
}

/**
 * // NOTE: Ota huomioon geodeesinen los linja.
 */
function calculateCoverage() {
    const links = getLinks()
    
    const map = getMap()
    const viewBounds = map.getBounds()
    const zoom = map.getZoom()
    const zLayer = cache.get(zoom)

    const nwTile = latlngToTileCoords(viewBounds.getNorthWest(), zoom),
        seTile = latlngToTileCoords(viewBounds.getSouthEast(), zoom)

    console.log('Links:', links)
    console.log('nw:', nwTile)
    console.log('se:', seTile)

    // Initialize / clear emission data
    for (const [coordsStr, obj] of zLayer.entries()) {
        obj.data.emission = new Int16Array(res*res)
        //console.log(coordsStr, viewBounds.overlaps(obj.bounds))
        //obj.drawEmission()
    }

    for (const link of links) {
        // Transformation: zero at east and increase counterclockwise.
        const bearing0 = (180 + -1 * (angle(map, link.unit0.latlng, link.unit1.latlng) - 180) + 90) % 360
        const bearing1 = (bearing0 + 180) % 360
        console.log(link, bearing0, bearing1)

        console.log(link.lineStats)
        console.log(link.values)
        // TODO: figure out a way to continue the geodesic line

        // instead of viewbounds check if it's inside the active tiles?
        if (viewBounds.contains(link.unit0.latlng)) calculateEmission(link.unit0, link.unit1, link, bearing0)
        if (viewBounds.contains(link.unit1.latlng)) calculateEmission(link.unit1, link.unit0, link, bearing1)
    }

    function calculateEmission(unit0: Unit, unit1: Unit, link: Link, bearing: number) {
        
    }
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
