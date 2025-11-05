import { LeafletMouseEvent, FeatureGroup, Polyline, Marker, DivIcon, DomUtil } from 'leaflet'
import { addAction } from '../../actionhistory'
import { RemoveLinkAction } from '../../actions/linkactions'
import Link from '../../struct/link'
import { showEditLinkMenu } from '../menus/linkmenus'
import { showLinkStatistics } from '../menus/linkstatisticsmenu'
import { isLinkInteractionEnabled } from '../structurecontroller'
import { linkLayerClick, linkLayerMouseDown, linkLayerMouseUp } from '../toolcontroller'
import UnitLayer from './unitlayer'
import { sealedArray } from '../../util'


export default class LinkLayer extends FeatureGroup {
    public link: Link
    // NOTE: Unit order is not updated according to the underlying link object.
    public unit = sealedArray<UnitLayer>(2)
    public line: Polyline
    public marker: Marker
    public element: HTMLElement
    constructor(link: Link, unit0: UnitLayer, unit1: UnitLayer, initUpdate = true) {
        const endPoints = getEndPoints(unit0, unit1)
        super()

        this.link = link
        this.unit[0] = unit0
        this.unit[1] = unit1

        const contextmenuItems = [{
                text: 'Info',
                index: 0,
                callback: () => showLinkStatistics(this._map, this)
            }, {
                separator: true,
                index: 1
            }, {
                text: 'Edit',
                index: 2,
                callback: () => showEditLinkMenu(this._map, this)
            }, {
                text: 'Remove',
                index: 3,
                callback: () => addAction(new RemoveLinkAction(this).forward())
            }, {
                separator: true,
                index: 4
        }]

        this.line = new Polyline(endPoints, {
            pmIgnore: true,
            color: 'black',
            opacity: 0.75,
            interactive: isLinkInteractionEnabled(),
            contextmenu: true,
            contextmenuItems
        })
        this.addLayer(this.line)

        this.element = DomUtil.create('div', 'link-marker')
        this.marker = new Marker(endPoints[0], {
            pmIgnore: true,
            opacity: 0.75,
            interactive: isLinkInteractionEnabled(),
            contextmenu: true,
            contextmenuItems,
            icon: new DivIcon({
                html: this.element,
                iconAnchor: [8, 8]
            })
        })
        this.addLayer(this.marker)

        this.addHandlers()
        if (initUpdate) this.update()
    }


    addHandlers() {
        this.on('click', this.click, this)
        this.on('mousedown', this.mousedown, this)
        this.on('mouseup', this.mouseup, this)

        this.unit[0].on('update', this.update, this)
        this.unit[1].on('update', this.update, this)
    }


    removeHandlers() {
        this.off('click', this.click)
        this.off('mousedown', this.mousedown)
        this.off('mouseup', this.mouseup)

        this.unit[0].off('update', this.update)
        this.unit[1].off('update', this.update)
    }


    static orderUnitLayers(unitLayer0: UnitLayer, unitLayer1: UnitLayer) {
        const [unit0] = Link.orderUnits(unitLayer0.unit, unitLayer1.unit)
        if (unit0.id !== unitLayer0.unit.id)
            return [unitLayer1, unitLayer0]
        return [unitLayer0, unitLayer1]
    }


    async update() {
        this.link.reorder()
        if (this.unit[0].unit.id != this.link.unit[0].id) {
            const temp = this.unit[0]
            this.unit[0] = this.unit[1]
            this.unit[1] = temp
        }
        const endPoints = getEndPoints(this.unit[0], this.unit[1])
        this.line.setLatLngs(endPoints)
        this.marker.setLatLng([(endPoints[0].lat + endPoints[1].lat) / 2, (endPoints[0].lng + endPoints[1].lng) / 2])
        this.element.innerText = this.link.medium.name // TODO: Add option to change the presentation format.
        const { values, lineStats, stats } = await this.link.calculate()

        // NOTE: Link performance values are basically just pulled out of the hat.
        let color: string, weight: number
        if ('A__db' in stats) {
            color = '#00ff0c'
            weight = 12
            if (stats.A_ref__db > 5) {
                color = '#00b9ff'
                weight = 8
            }
            if (stats.A_ref__db > 10) {
                color = '#e77800'
                weight = 6
            }
            if (stats.A_ref__db  > 20) {
                color = '#ec2400'
                weight = 4
            }
        } else {
            color = 'gray'
            weight = 12
        }
        this.line.setStyle({
            weight,
            color
        })

        const textBearing = (this.link.bearing[0] + this.link.bearing[1]) / 2 + 180
        this.element.style.transform = `rotate(${textBearing}deg)`

        this.fire('update', { endPoints, values, lineStats, stats })
    }


    click(e: LeafletMouseEvent) {
        linkLayerClick(e, this)
    }
    mousedown(e: LeafletMouseEvent) {
        linkLayerMouseDown(e, this)
    }
    mouseup(e: LeafletMouseEvent) {
        linkLayerMouseUp(e, this)
    }
}


function getEndPoints(unit0: UnitLayer, unit1: UnitLayer) {
    return [unit0.getLatLng(), unit1.getLatLng()]
}