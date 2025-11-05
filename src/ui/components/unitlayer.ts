import { LatLng, Marker, DomUtil, divIcon, point, LeafletMouseEvent, Popup } from 'leaflet'
import { Symbol as MilSymbol } from 'milsymbol'
import Unit from '../../struct/unit'
import { showEditUnitMenu } from '../menus/unitmenus'
import { showAddLinkMenu } from '../menus/linkmenus'
import { unitLayerClick, unitLayerMouseDown, unitLayerMouseUp } from '../toolcontroller'
import { getPointInfo } from '../../topoutil'
import { addAction } from '../../actionhistory'
import { MoveUnitAction, RemoveUnitAction } from '../../actions/unitactions'
import { isUnitInteractionEnabled } from '../structurecontroller'
import { getLinksByUnitId } from '../../struct'


const iconSize = 40


export default class UnitLayer extends Marker {
    public unit: Unit
    public svg: HTMLElement
    public hitbox: HTMLDivElement
    private popup: Popup
    constructor(unit: Unit) {
        unit.symbol.setOptions({
            infoBackground: '#ffffffaa',
            outlineColor: '#000000aa', // NOTE: Change to modifiable
            outlineWidth: 2
        })
        const { icon, svg, hitbox } = createIcon(unit.symbol, iconSize);
        (svg as any).unitid = unit.id

        super(unit.latlng, {
            pmIgnore: true,
            icon,
            interactive: isUnitInteractionEnabled(),
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
        })

        this.unit = unit
        this.svg = svg
        this.hitbox = hitbox
        this.hitbox.id = this.unit.id
        this.popup = new Popup()
        this.addHandlers()
    }


    addHandlers() {
        this.on('dragend', this.dragEnd, this)
        this.on('click', this.click, this)
        this.on('mousedown', this.mouseDown, this)
        this.on('mouseup', this.mouseUp, this)
    }

    removeHandlers() {
        this.off('dragend', this.dragEnd)
        this.off('click', this.click)
        this.off('mousedown', this.mouseDown)
        this.off('mouseup', this.mouseUp)
    }


    setUnitLatLng(latlng: LatLng) {
        this.unit.latlng = latlng
        this.setLatLng(latlng)
        this.fire('update', { latlng, symbol: this.unit.symbol })
    }

    setLatLngSymbol(latlng: LatLng, symbol: MilSymbol) {
        this.unit.latlng = latlng
        this.unit.setSymbol(symbol)
        this.setLatLng(latlng);
        (this.getIcon() as any).update(symbol, iconSize)
        this.fire('update', { latlng, symbol })
    }

    async openInfoPopup() {
        const info = {
            ...await getPointInfo(this.unit.latlng),
            unit: this.unit.unitIdentifier(false),
            id: this.unit.id
        } as any

        for (const link of getLinksByUnitId(this.unit.id)) {
            // Prevent name collisions
            let name = link.medium.name, i = 0
            if (name in info) {
                ++i
                while (`${name}_${i}` in info) ++i
                name += '_' + i
            }

            const zero = link.unit[0].id == this.unit.id
            info[name] = Math.round(zero ? link.bearing[0] : link.bearing[1]) + '°'
        }

        const div = DomUtil.create('div', 'info-table')
        for (const field in info) {
            const a = DomUtil.create('span'), b = DomUtil.create('span')
            a.innerText = field; b.innerText = info[field]
            div.append(a, b)
        }

        this.popup.setContent(div)
        this.bindPopup(this.popup)
        this.openPopup()
        this.unbindPopup()
    }


    dragEnd() {
        addAction(new MoveUnitAction(this, this.unit.latlng, this.getLatLng()).forward())
        if (this.popup.isOpen()) this.openInfoPopup()
    }
    click(e: LeafletMouseEvent) {
        unitLayerClick(e, this)
    }
    mouseDown(e: LeafletMouseEvent) {
        unitLayerMouseDown(e, this)
    }
    mouseUp(e: LeafletMouseEvent) {
        unitLayerMouseUp(e, this)
    }


    select() {
        if (!this.hitbox.classList.contains('unit-selected'))
            this.hitbox.classList.add('unit-selected')
    }
    deselect() {
        if (this.hitbox.classList.contains('unit-selected'))
            this.hitbox.classList.remove('unit-selected')
    }
    toggleSelect() {
        if (this.hitbox.classList.contains('unit-selected'))
            this.hitbox.classList.remove('unit-selected')
        else this.hitbox.classList.add('unit-selected')
    }
    isSelected() {
        return this.hitbox.classList.contains('unit-selected')
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