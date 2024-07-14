import { DomUtil, GridLayer, Map as LMap } from 'leaflet'
import { getTiledata } from 'tiledata'
import { tileDataStorage } from '../..'
import { getLinks } from '../../struct';


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


const drawBuffer = new Map<string, Function>();
const timeout = 1000;
let tid: number


function waitFinish() {
    if (tid) clearTimeout(tid)
    tid = setTimeout(() => {
        console.log('wait finished')
        calculateCoverage()
        for (const [coords, callback] of drawBuffer.entries()) {
            callback()
        }
        drawBuffer.clear()
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
    console.log(links)
    for (const [coords] of drawBuffer.entries()) {
        console.log('Coords:', coords)
    }
}


(GridLayer as any).emissionLayer = GridLayer.extend({
    onAdd: function(map: LMap) {
        this._map = map

        map.on('moveend', onMoveEnd)

        GridLayer.prototype.onAdd.call(this, map)
    },
    onRemove: function(map: LMap) {
        map.off('moveend', onMoveEnd)
        GridLayer.prototype.onRemove.call(this, map)
    },
    createTile: function (coords: TileCoords, callback: Function) {
        console.log('loading')
        waitFinish()
        const tile = DomUtil.create('canvas', 'leaflet-tile')
        const size = this.getTileSize()
        tile.width = size.x
        tile.height = size.y

        drawBuffer.set(`${coords.x}|${coords.y}|${coords.z}`, () => this.drawEmission(coords, tile))

        async function loadData() {
            try {
                await getTiledata(coords, ['elevation'])
            }
            catch (e) {
                // try reloading it?
            }
            finally {
                console.log('loaded')
                waitFinish()
                callback(null, tile)
            }
        }
        loadData()

        return tile
    },
    drawEmission: function(coords: TileCoords, tile: HTMLCanvasElement) {
        const ctx = tile.getContext('2d')
        ctx.clearRect(0, 0, tile.width, tile.height)

        ctx.strokeStyle = 'black'
        ctx.strokeRect(0, 0, tile.width, tile.height)

        ctx.fillStyle = 'gray'
        const coordsText = [coords.x, coords.y, coords.z].join(', ')
        ctx.strokeText(coordsText, 0, 10)
        ctx.fillText(coordsText, 0, 10)
    }
})
