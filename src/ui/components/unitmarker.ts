import * as L from 'leaflet'
import { Symbol as MilSymbol } from 'milsymbol'
import { ExtendedMarkerOptions } from '../../interfaces'
import Unit from '../../struct/unit'
import { removeUnit as structRemoveUnit } from '../../struct'
import { getMap, removeUnit as lgRemoveUnit } from '../layercontroller'
import { showEditUnitMenu } from '../unitmenus'
import { showAddLinkMenu } from '../linkmenus'


const iconSize = 40


export function createMarker(latlng: L.LatLng, unit: Unit) {
    const { icon, svg, hitbox } = createIcon(unit.symbol, iconSize);
    (icon as any).update = (symbol: MilSymbol, size: number) => {
        setHitboxLocation(hitbox, applySymbol(svg, symbol, size))
    }
    return L.marker(latlng, {
        icon,
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
    (marker.getIcon() as any).update(symbol, iconSize)
}


export function createIcon(symbol: MilSymbol, size: number) {
    symbol.setOptions({
        size: size / 16 * 10
    })
    const div = L.DomUtil.create('div', 'node')
    const svg = L.DomUtil.create('svg', 'node-milsymbol')
    const hitbox = L.DomUtil.create('div', 'node-hitbox')
    const hitboxAnchor = applySymbol(svg, symbol, size)
    setHitboxLocation(hitbox, hitboxAnchor)
    hitbox.style.width = hitbox.style.height = size + 'px'
    div.append(svg, hitbox)

    const icon = L.divIcon({
        className: 'node-marker',
        html: div,
        iconAnchor: L.point(0, 0)
    })
    return { icon, svg, hitbox }
}


function setHitboxLocation(hitbox: HTMLElement, anchor: { x: number, y: number }) {
    hitbox.style.left = anchor.x + 'px'
    hitbox.style.top = anchor.y + 'px'
}


function applySymbol(svg: HTMLElement, symbol: MilSymbol, size: number) {
    const isHQ = symbol.getMetadata().headquarters
    const anchor = symbol.getAnchor()
    svg.innerHTML = symbol.asSVG()
    svg.style.left = (-anchor.x) + 'px'
    svg.style.top = (-anchor.y) + 'px'
    return {
        x: -(isHQ ? 0 : size / 2),
        y: -(isHQ ? size * 1.5 : size / 2)
    }
}