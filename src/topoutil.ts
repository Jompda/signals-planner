import * as tiledata from 'tiledata'
import * as mgrs from 'mgrs'
import * as utm from 'utm'
import { Map as LMap, LatLng as LLatLng, latLng, Topography, popup } from 'leaflet'
import { round } from './util'
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


export function geodesicLineStats(latlng0: LatLng, latlng1: LatLng) {
    const distance = new LatLon(latlng0.lat, latlng0.lng).distanceTo(new LatLon(latlng1.lat, latlng1.lng))
    const steps = Math.floor(Math.log2(distance / 100)) // pDist: min 100, max 2*100=200 meters
    const pDist = distance / (2 ** steps)
    return { steps, pDist }
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