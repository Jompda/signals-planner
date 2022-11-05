import * as L from 'leaflet'
import { Symbol as MilSymbol } from 'milsymbol'
import { ExtendedMarkerOptions } from '../../interfaces'
import Unit from '../../struct/unit'
import { removeUnit as structRemoveUnit } from '../../struct'
import { getMap, removeUnit as lgRemoveUnit } from '../layercontroller'
import { showEditUnitMenu } from '../unitmenus'
import { showAddLinkMenu } from '../linkmenus'


export function createMarker(latlng: L.LatLng, unit: Unit) {
    return L.marker(latlng, {
        icon: createIcon(unit.symbol, 40),
        draggable: true,
        contextmenu: true,
        contextmenuItems: [{
            text: '(Info)',
            index: 0
        }, {
            separator: true,
            index: 1
        }, {
            text: 'Add Link',
            index: 2,
            callback: () => showAddLinkMenu(getMap(), unit)
        }, {
            separator: true,
            index: 3
        }, {
            text: 'Edit',
            index: 4,
            callback: () => showEditUnitMenu(getMap(), unit)
        }, {
            text: 'Remove',
            index: 5,
            callback: () => {
                structRemoveUnit(unit)
                lgRemoveUnit(unit)
            }
        }, {
            separator: true,
            index: 6
        }]
    } as ExtendedMarkerOptions)
}


export function updateMarker(marker: L.Marker, symbol: MilSymbol) {
    marker.setIcon(createIcon(symbol, 40))
}


export function createIcon(symbol: MilSymbol, size: number) {
    const isHQ = symbol.getMetadata().headquarters
    symbol.setOptions({
        size: size / 16 * 10
    })
    const div = L.DomUtil.create('div', 'node')
    const svg = L.DomUtil.create('svg', 'node-milsymbol')
    const hitbox = L.DomUtil.create('div', 'node-hitbox')
    svg.innerHTML = symbol.asSVG()
    const anchor = symbol.getAnchor()
    svg.style.left = (-anchor.x) + 'px'
    svg.style.top = (-anchor.y) + 'px'
    hitbox.style.left = -(isHQ ? 0 : size / 2) + 'px'
    hitbox.style.top = -(isHQ ? size * 1.5 : size / 2) + 'px'
    hitbox.style.width = hitbox.style.height = size + 'px'
    div.append(svg, hitbox)

    const icon = L.divIcon({
        className: 'node-marker',
        html: div,
        iconAnchor: L.point(0, 0)
    });
    return icon
}