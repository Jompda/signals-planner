import * as tiledata from 'tiledata'
import * as mgrs from 'mgrs'
import * as utm from 'utm'
import { Map as LMap, LatLng as LLatLng, latLng, Topography, popup } from 'leaflet'
import { round } from './util'


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