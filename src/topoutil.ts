import * as tiledata from 'tiledata'


let maxWorkers = 10
export function getMaxWorkers() {
    return maxWorkers
}
export function setMaxWorkers(amount: number) {
    maxWorkers = amount
}


export async function getElevation(latlng: { lat: number, lng: number }, zoom: number) {
    const coords = tiledata.latlngToTileCoords(latlng, zoom)
    const xyOnTile = tiledata.latlngToXYOnTile(latlng, zoom)
    const result = await tiledata.getTiledata(coords, ['elevation'])
    return result.elevation[xyOnTile.y * 256 + xyOnTile.x]
}
