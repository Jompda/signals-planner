import { LatLng, Marker, DomUtil, divIcon, point, LeafletMouseEvent } from 'leaflet'
import { Symbol as MilSymbol } from 'milsymbol'
import { ExtendedMarkerOptions } from '../../interfaces'
import Unit from '../../struct/unit'
import { showEditUnitMenu } from '../menus/unitmenus'
import { showAddLinkMenu } from '../menus/linkmenus'
import { isDefaultTool } from '../toolcontroller'
import { getTopographyStr } from '../../topoutil'
import { addAction } from '../../actionhistory'
import { MoveUnitAction, RemoveUnitAction } from '../../actions/unitactions'


const iconSize = 40


export default class UnitLayer extends Marker {
    public unit: Unit
    constructor(unit: Unit) {
        const { icon, svg } = createIcon(unit.symbol, iconSize);
        (svg as any).unitid = unit.id

        super(unit.latlng, {
            icon,
            draggable: true,
            contextmenu: true,
            contextmenuItems: [{
                text: 'Info',
                index: 0,
                callback: () => this.openInfoPopup()
            }, {
                separator: true,
                index: 1
            }, {
                text: 'Add Link',
                index: 2,
                callback: () => showAddLinkMenu(this._map, this)
            }, {
                separator: true,
                index: 3
            }, {
                text: 'Edit',
                index: 4,
                callback: () => showEditUnitMenu(this._map, this)
            }, {
                text: 'Remove',
                index: 5,
                callback: () => addAction(new RemoveUnitAction(this).forward())
            }, {
                separator: true,
                index: 6
            }]
        } as ExtendedMarkerOptions)

        this.unit = unit


        this.on('dragend', () => {
            addAction(new MoveUnitAction(this, this.unit.latlng, this.getLatLng()))
            this.unit.latlng = this.getLatLng()
        })

        this.on('click', () => {
            if (!isDefaultTool()) return
            if (svg.classList.contains('unit-selected'))
                svg.classList.remove('unit-selected')
            else svg.classList.add('unit-selected')
        })

        this.on('middlemouseclick', () => this.openInfoPopup())

        this.on('mouseup', (e: LeafletMouseEvent) => {
            if (e.originalEvent.button === 1)
                this.fire('middlemouseclick', e)
        })
    }

    setUnitLatLng(latlng: LatLng) {
        this.unit.latlng = latlng
        this.setLatLng(latlng)
        this.fire('update', { latlng, symbol: this.unit.symbol })
    }

    setLatLngSymbol(latlng: LatLng, symbol: MilSymbol) {
        this.unit.latlng = latlng
        this.setLatLng(latlng);
        (this.getIcon() as any).update(symbol, iconSize)
        this.fire('update', { latlng, symbol })
    }

    async openInfoPopup() {
        if (!isDefaultTool()) return
        const topographyStr = await getTopographyStr(this.unit.latlng)
        const str = (
            `${this.unit.toHierarchyString()}<br>` +
            `Id: ${this.unit.id}<br>` +
            '<hr>' +
            topographyStr
        )
        this.bindPopup(str)
        this.openPopup()
        this.unbindPopup()
    }
}


export function createIcon(symbol: MilSymbol, size: number) {
    symbol.setOptions({
        size: size / 16 * 10
    })
    const div = DomUtil.create('div', 'unit')
    const svg = DomUtil.create('svg', 'unit-milsymbol')
    const hitbox = DomUtil.create('div', 'unit-hitbox')
    hitbox.style.width = hitbox.style.height = size + 'px'
    div.append(svg, hitbox)

    const icon = divIcon({
        className: 'unit-marker',
        html: div,
        iconAnchor: point(0, 0)
    });

    (icon as any).update = (symbol: MilSymbol, size: number) => {
        const hitboxAnchor = applySymbol(svg, symbol, size)
        icon.options.popupAnchor = [hitboxAnchor.x + iconSize / 2, hitboxAnchor.y]
        setHitboxLocation(hitbox, hitboxAnchor)
    };

    (icon as any).update(symbol, size)

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