import * as tiledata from 'tiledata'
import * as mgrs from 'mgrs'
import * as utm from 'utm'
import { Map as LMap, LatLng as LLatLng, latLng, Topography, popup } from 'leaflet'
import { asyncOperation, getMaxWorkers, round, workers } from './util'
import LatLon from 'geodesy/latlon-spherical'


export async function getElevation(latlng: LatLng, zoom: number) {
    const coords = tiledata.latlngToTileCoords(latlng, zoom)
    const xyOnTile = tiledata.latlngToXYOnTile(latlng, zoom)
    const result = await tiledata.getTiledata(coords, ['elevation'])
    return result.elevation[xyOnTile.y * 256 + xyOnTile.x]
}


export async function openTopographyPopup(map: LMap, latlng: LLatLng) {
    popup()
        .setLatLng(latlng)
        .setContent(await getTopographyStr(latlng) as string)
        .openOn(map)
}


export function createLosGetter(elevation0: number, elevation1: number, lastIndex: number) {
    const elevationDelta = elevation1 - elevation0
    return (i: number) => elevation0 + (elevationDelta * (i / lastIndex))
}


export function getLineStats(latlngs: Array<any>, fields: Array<string>) {
    function sumAt(i: number) {
        let sum = 0
        for (let j = 0; j < fields.length; j++)
            sum += latlngs[i][fields[j]]
        return sum
    }

    const distance = latlngs[0].latlng.distanceTo(latlngs[1].latlng)
    const extremes = {
        min: sumAt(0),
        iMin: 0,
        max: sumAt(0),
        iMax: 0
    }
    for (let i = 1; i < latlngs.length; i++) {
        const temp = sumAt(i)
        if (temp < extremes.min) {
            extremes.min = temp
            extremes.iMin = i
        }
        if (temp > extremes.max) {
            extremes.max = temp
            extremes.iMax = i
        }
    }

    const peaks = {
        values: new Array<number>(),
        indexes: new Array<number>()
    }
    for (let i = 1; i < latlngs.length - 1; i++) {
        const temp = sumAt(i)
        if (temp <= sumAt(i - 1)) continue
        if (temp <= sumAt(i + 1)) continue
        peaks.indexes.push(i)
        peaks.values.push(temp)
    }

    return {
        distance,
        extremes,
        peaks
    }
}


export async function getValues(latlngs: Array<LatLng>, sourceNames: Array<string>, zoom: number) {
    const { latlngs: mappedLatLngs, tileNames } = mapLatLngsToTiles(latlngs, zoom)
    const tiles = await getTiles(tileNames, sourceNames)
    for (const obj of mappedLatLngs) {
        const tile = tiles.get(obj.tileName)
        const xyOnTile = tiledata.latlngToXYOnTile(obj.latlng, zoom)
        for (const srcName of sourceNames) {
            obj[srcName] = tile[srcName][xyOnTile.y * 256 + xyOnTile.x]
        }
    }
    return mappedLatLngs
}


export function getTiles(tilesNames: Array<string>, sourceNames: Array<string>) {
    return new Promise<Map<string, any>>((resolve, reject) => {
        const tiles = new Map<string, any>()
        const check = asyncOperation(tilesNames.length, undefined, () => {
            resolve(tiles)
        })
        workers(tilesNames, (tileName) => {
            return new Promise((res, rej) => {
                const parts = tileName.split('|')
                const tileCoords = {
                    x: +parts[0],
                    y: +parts[1],
                    z: +parts[2]
                }
                tiledata.getTiledata(tileCoords, sourceNames)
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
    const mapped = new Array()
    const tileNames = new Map<string, boolean>()
    for (const latlng of latlngs) {
        const tileCoords = tiledata.latlngToTileCoords(latlng, zoom)
        const tileName = `${tileCoords.x}|${tileCoords.y}|${tileCoords.z}`
        const obj = { tileName, latlng }
        let arr = tileNames.get(tileName)
        if (!arr) tileNames.set(tileName, true)
        mapped.push(obj)
    }
    return { latlngs: mapped, tileNames: Array.from(tileNames.keys()) }
}


export function getGeodesocLine_PDist100to200(latlng0: LatLng, latlng1: LatLng) {
    const { steps, delta } = geodesicLineStats(latlng0, latlng1)
    const latlngs = getGeodesicLine(latlng0, latlng1, steps)
    return { latlngs, delta }
}


export function geodesicLineStats(latlng0: LatLng, latlng1: LatLng) {
    const distance = new LatLon(latlng0.lat, latlng0.lng).distanceTo(new LatLon(latlng1.lat, latlng1.lng))
    const steps = Math.floor(Math.log2(distance / 100)) // delta: min 100, max 2*100=200 meters
    const delta = distance / (2 ** steps)
    return { steps, delta }
}


export function getGeodesicLine(latlng0: LatLng, latlng1: LatLng, steps: number) {
    const amount = 2 ** steps - 1
    const p0 = new LatLon(latlng0.lat, latlng0.lng)
    const p1 = new LatLon(latlng1.lat, latlng1.lng)
    const points = Array(amount)

    rmp(p0, p1, 0, amount, 0)
    function rmp(p0: LatLon, p1: LatLon, i0: number, i1: number, d: number) {
        if (d >= steps) return
        const value = p0.midpointTo(p1)
        const ci = Math.floor((i0 + i1) / 2)
        points[ci] = value
        rmp(p0, value, i0, ci, d + 1)
        rmp(value, p1, ci, i1, d + 1)
    }

    return [p0, ...points, p1].map((latlon: LatLon) => latLng(latlon.lat, latlon.lon))
}


export async function getTopographyStr(latlng: LLatLng) {
    const result = await Topography.getTopography(latlng)
    let str =
        'Lat: ' + String(round(latlng.lat, 6)).padEnd(9, '0') + '<br>' +
        'Lng: ' + String(round(latlng.lng, 6)).padEnd(9, '0') + '<br>' +
        'MGRS: ' + mgrs.forward([latlng.lng, latlng.lat]) + '<br>' +
        'UTM: ' + latlngToUtm(latlng) + '<br>' +
        'Elevation: ' + round(result.elevation) + 'm<br>' +
        'Slope: ' + round(result.slope) + '°<br>' +
        'Aspect: ' + round(result.aspect) + '°<br>' +
        'Resolution: ' + round(result.resolution)
    return str
}

export function latlngToUtm(latlng: LatLng) {
    const s = utm.fromLatLon(latlng.lat, latlng.lng)
    return `${s.zoneNum}${s.zoneLetter} ${Math.floor(s.easting)} ${Math.floor(s.northing)}`
}

export function utmToLatLng(str: string) {
    const parts = str.split(' ')
    const s1 = parts[0]
    const s = utm.toLatLon(
        +parts[1],
        +parts[2],
        +s1.slice(0, s1.length - 1),
        s1[s1.length - 1]
    )
    return latLng(s.latitude, s.longitude)
}