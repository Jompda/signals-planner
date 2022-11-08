import { LatLng, Marker, DomUtil, divIcon, point, LeafletMouseEvent } from 'leaflet'
import { Symbol as MilSymbol } from 'milsymbol'
import { ExtendedMarkerOptions } from '../../interfaces'
import Unit from '../../struct/unit'
import { removeUnit as structRemoveUnit } from '../../struct'
import { getMap, removeUnit as lgRemoveUnit } from '../structurecontroller'
import { showEditUnitMenu } from '../menus/unitmenus'
import { showAddLinkMenu } from '../menus/linkmenus'
import { isDefaultTool } from '../toolcontroller'


const iconSize = 40


export default class UnitLayer extends Marker {
    public unit: Unit
    constructor(unit: Unit) {
        const { icon, svg, hitbox } = createIcon(unit.symbol, iconSize);
        (icon as any).update = (symbol: MilSymbol, size: number) => {
            setHitboxLocation(hitbox, applySymbol(svg, symbol, size))
        }
        (svg as any).unitid = unit.id

        super(unit.latlng, {
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
                callback: () => showAddLinkMenu(getMap(), this)
            }, {
                separator: true,
                index: 3
            }, {
                text: 'Edit',
                index: 4,
                callback: () => showEditUnitMenu(getMap(), this)
            }, {
                text: 'Remove',
                index: 5,
                callback: () => {
                    structRemoveUnit(unit)
                    lgRemoveUnit(this)
                }
            }, {
                separator: true,
                index: 6
            }]
        } as ExtendedMarkerOptions)

        this.unit = unit

        this.on('click', () => {
            if (!isDefaultTool()) return
            if (svg.classList.contains('unit-selected'))
                svg.classList.remove('unit-selected')
            else svg.classList.add('unit-selected')
        })

        this.on('dragend', (e: LeafletMouseEvent) => {
            this.unit.latlng = this.getLatLng()
        })
    }

    setLatLngSymbol(latlng: LatLng, symbol: MilSymbol) {
        this.unit.latlng = latlng
        this.setLatLng(latlng);
        (this.getIcon() as any).update(symbol, iconSize)
        this.fire('update', { latlng, symbol })
    }
}


export function createIcon(symbol: MilSymbol, size: number) {
    symbol.setOptions({
        size: size / 16 * 10
    })
    const div = DomUtil.create('div', 'unit')
    const svg = DomUtil.create('svg', 'unit-milsymbol')
    const hitbox = DomUtil.create('div', 'unit-hitbox')
    const hitboxAnchor = applySymbol(svg, symbol, size)
    setHitboxLocation(hitbox, hitboxAnchor)
    hitbox.style.width = hitbox.style.height = size + 'px'
    div.append(svg, hitbox)

    const icon = divIcon({
        className: 'unit-marker',
        html: div,
        iconAnchor: point(0, 0)
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