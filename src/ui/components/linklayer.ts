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
            text: 'Remove',
            index: 1,
            callback: () => {
                structRemoveLink(link)
                lgRemoveLink(link)
            }
        }]
    } as ExtendedLayerOptions)
}