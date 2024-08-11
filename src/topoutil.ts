import { latlngToTileCoords, latlngToXYOnTile, getTiledata } from 'tiledata'
import { forward as mgrsForward } from 'mgrs'
import { fromLatLon as utmFromLatLon, toLatLon as utmToLatLon } from 'utm'
import { Map as LMap, LatLng as LLatLng, latLng, Topography, popup, DomUtil } from 'leaflet'
import { asyncOperation, getMaxWorkers, round, workers } from './util'
import { SourceName, TiledataLatLng } from './interfaces'


export async function getTopographyValues<SourceName extends string>(sourceNames: Array<SourceName>, latlng: LatLng, zoom: number) {
    const coords = latlngToTileCoords(latlng, zoom)
    const xyOnTile = latlngToXYOnTile(latlng, zoom)
    const result = await getTiledata<SourceName>(coords, sourceNames)
    return sourceNames.map(sourceName => result[sourceName][xyOnTile.y * 256 + xyOnTile.x])
}


export async function openInfoPopup(map: LMap, latlng: LLatLng) {
    const info = await getPointInfo(latlng) as any
    const div = DomUtil.create('div', 'info-table')

    for (const field in info) {
        const a = DomUtil.create('span'), b = DomUtil.create('span')
        a.innerText = field; b.innerText = info[field]
        div.append(a, b)
    }

    popup()
        .setLatLng(latlng)
        .setContent(div)
        .openOn(map)
}


export async function getValues(latlngs: Array<LatLng>, sourceNames: Array<SourceName>, zoom: number) {
    const { latlngs: latlngs2, tileNames } = mapLatLngsToTiles(latlngs, zoom)
    const mappedLatLngs = latlngs2 as Array<TiledataLatLng>
    const tiles = await getTiles(tileNames, sourceNames)
    for (const obj of mappedLatLngs) {
        const tile = tiles.get(obj.tileName)
        const xyOnTile = latlngToXYOnTile(obj.latlng, zoom)
        for (const srcName of sourceNames) {
            obj[srcName] = tile[srcName][xyOnTile.y * 256 + xyOnTile.x]
        }
    }
    return mappedLatLngs
}

export function getTiles(tilesNames: Array<string>, sourceNames: Array<SourceName>): Promise<Map<string, Record<SourceName, Int16Array>>> {
    return new Promise<Map<string, Record<SourceName, Int16Array>>>((resolve, reject) => {
        const tiles = new Map<string, Record<SourceName, Int16Array>>()
        const check = asyncOperation(tilesNames.length, undefined, () => {
            resolve(tiles)
        })
        workers(tilesNames, (tileName) => {
            return new Promise((res, rej) => {
                const [x, y, z] = tileName.split('|').map(a => +a)
                const tileCoords = { x, y, z }
                getTiledata<SourceName>(tileCoords, sourceNames)
                    .then(data => {
                        tiles.set(tileName, data)
                        check()
                        res()
                    })
                    .catch(reject)
            })
        }, getMaxWorkers())
    })
}

export function mapLatLngsToTiles(latlngs: Array<LatLng>, zoom: number) {
    const mapped = new Array<{ tileName: string, latlng: LatLng }>()
    const tileNames = new Map<string, boolean>()
    for (const latlng of latlngs) {
        const tileCoords = latlngToTileCoords(latlng, zoom)
        const tileName = `${tileCoords.x}|${tileCoords.y}|${tileCoords.z}`
        const obj = { tileName, latlng }
        let arr = tileNames.get(tileName)
        if (!arr) tileNames.set(tileName, true)
        mapped.push(obj)
    }
    return { latlngs: mapped, tileNames: Array.from(tileNames.keys()) }
}


export async function getPointInfo(latlng: LLatLng) {
    const [topography, treeHeight] = await Promise.all([
        Topography.getTopography(latlng),
        getTopographyValues(['treeHeight'], latlng, 10)
    ])
    return {
        lat: String(round(latlng.lat, 6)).padEnd(9, '0'),
        lng: String(round(latlng.lng, 6)).padEnd(9, '0'),
        mgrs: mgrsForward([latlng.lng, latlng.lat]),
        utm: latlngToUtm(latlng),
        treeHeight: treeHeight[0] + 'm',
        elevation: round(topography.elevation) + 'm',
        slope: round(topography.slope) + '°',
        aspect: round(topography.aspect) + '°',
        resolution: round(topography.resolution)
    }
}

export function latlngToUtm(latlng: LatLng) {
    const s = utmFromLatLon(latlng.lat, latlng.lng)
    return `${s.zoneNum}${s.zoneLetter} ${Math.floor(s.easting)} ${Math.floor(s.northing)}`
}

export function utmToLatLng(str: string) {
    const parts = str.split(' ')
    const s1 = parts[0]
    const s = utmToLatLon(
        +parts[1],
        +parts[2],
        +s1.slice(0, s1.length - 1),
        s1[s1.length - 1]
    )
    return latLng(s.latitude, s.longitude)
}