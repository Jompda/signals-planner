import { LeafletMouseEvent, Polyline } from 'leaflet'
import { addAction } from '../../actionhistory'
import { RemoveLinkAction } from '../../actions/linkactions'
import { ExtendedLayerOptions } from '../../interfaces'
import Link from '../../struct/link'
import { showEditLinkMenu } from '../menus/linkmenus'
import { showLinkStatistics } from '../menus/linkstatistics'
import { getActiveTool } from '../toolcontroller'
import UnitLayer from './unitlayer'


export default class LinkLayer extends Polyline {
    public link: Link
    public unit0: UnitLayer
    public unit1: UnitLayer
    constructor(link: Link, unit0: UnitLayer, unit1: UnitLayer) {
        const endPoints = getEndPoints(unit0, unit1)
        super(endPoints, {
            color: 'black',
            opacity: 0.75,
            draggable: true,
            contextmenu: true,
            contextmenuItems: [{
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
        } as ExtendedLayerOptions)

        this.link = link
        this.unit0 = unit0
        this.unit1 = unit1

        this.addHandlers()
        this.update()
    }


    addHandlers() {
        this.on('click', this.click, this)
        this.on('middlemouseclick', this.middleMouseClick, this)
        this.on('mouseup', this.mouseUp, this)

        this.unit0.on('dragend', this.update, this)
        this.unit1.on('dragend', this.update, this)
        this.unit0.on('update', this.update, this)
        this.unit1.on('update', this.update, this)
    }


    removeHandlers() {
        this.off('click', this.click)
        this.off('middlemouseclick', this.middleMouseClick)
        this.off('mouseup', this.mouseUp)

        this.unit0.off('dragend', this.update)
        this.unit1.off('dragend', this.update)
        this.unit0.off('update', this.update)
        this.unit1.off('update', this.update)
    }


    async update() {
        this.link.reorder()
        if (this.unit0.unit.id != this.link.unit0.id) {
            const temp = this.unit0
            this.unit0 = this.unit1
            this.unit1 = temp
        }
        const endPoints = getEndPoints(this.unit0, this.unit1)
        this.setLatLngs(endPoints)
        const { values, lineStats, stats } = await this.link.calculate()

        let color: string, weight: number
        if ('dB' in stats) {
            color = '#00ff0c'
            weight = 12
            if (stats.dB < -55) {
                color = '#00b9ff'
                weight = 8
            }
            if (stats.dB < -70) {
                color = '#e77800'
                weight = 6
            }
            if (stats.dB <= -80) {
                color = '#ec2400'
                weight = 4
            }
        } else {
            color = 'gray'
            weight = 12
        }
        this.setStyle({
            weight,
            color
        })

        this.fire('update', { endPoints, values, lineStats, stats })
    }


    click() {
        if (!getActiveTool().unitSelecting) return
        console.log('clicked link')
    }
    middleMouseClick() {
        if (!getActiveTool().mmbTopography) return
        showLinkStatistics(this._map, this)
    }
    mouseUp(e: LeafletMouseEvent) {
        if (e.originalEvent.button === 1)
            this.fire('middlemouseclick', e)
    }
}


function getEndPoints(unit0: UnitLayer, unit1: UnitLayer) {
    return [unit0.getLatLng(), unit1.getLatLng()]
}