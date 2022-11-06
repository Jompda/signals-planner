import * as L from 'leaflet'
import { ExtendedLayerOptions } from '../../interfaces'
import { removeLink as structRemoveLink } from '../../struct'
import Link from '../../struct/link'
import { removeLink as lgRemoveLink } from '../structurecontroller'


export function createLinkLayer(endPoints: Array<L.LatLng>, link: Link) {
    const layer = L.polyline(endPoints, {
        draggable: true,
        contextmenu: true,
        contextmenuItems: [{
            text: '(Info)',
            index: 0
        }, {
            separator: true,
            index: 1
        }, {
            text: '(Edit)',
            index: 2
        }, {
            text: 'Remove',
            index: 3,
            callback: () => {
                structRemoveLink(link)
                lgRemoveLink(link)
            }
        }, {
            separator: true,
            index: 4
        }]
    } as ExtendedLayerOptions)

    layer.on('click', () => console.log('clicked link'))

    layer.on('update', (
        (data: { endPoints: [L.LatLng] }) =>
            layer.setLatLngs(data.endPoints)
    ) as any)

    return layer
}