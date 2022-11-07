import * as tiledata from 'tiledata'


export async function getElevation(latlng: LatLng, zoom: number) {
    const coords = tiledata.latlngToTileCoords(latlng, zoom)
    const xyOnTile = tiledata.latlngToXYOnTile(latlng, zoom)
    const result = await tiledata.getTiledata(coords, ['elevation'])
    return result.elevation[xyOnTile.y * 256 + xyOnTile.x]
}
