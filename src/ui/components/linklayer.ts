import * as L from 'leaflet'
import { ExtendedLayerOptions } from '../../interfaces'
import { removeLink as structRemoveLink } from '../../struct'
import Link from '../../struct/link'
import { removeLink as lgRemoveLink } from '../layercontroller'


export function createLinkLayer(endPoints: Array<L.LatLng>, link: Link) {
    return L.polyline(endPoints, {
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
}