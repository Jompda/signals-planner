import { LeafletMouseEvent, Polyline } from 'leaflet'
import { ExtendedLayerOptions } from '../../interfaces'
import { removeLink as structRemoveLink } from '../../struct'
import Link from '../../struct/link'
import { showLinkStatistics } from '../menus/linkstatistics'
import { removeLink as lgRemoveLink } from '../structurecontroller'
import { isDefaultTool } from '../toolcontroller'
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
                text: '(Edit)',
                index: 2
            }, {
                text: 'Remove',
                index: 3,
                callback: () => {
                    structRemoveLink(link)
                    lgRemoveLink(this)
                }
            }, {
                separator: true,
                index: 4
            }]
        } as ExtendedLayerOptions)

        this.link = link
        this.unit0 = unit0
        this.unit1 = unit1


        this.on('click', () => {
            if (!isDefaultTool()) return
            console.log('clicked link')
        })

        this.on('middlemouseclick', () => {
            if (!isDefaultTool()) return
            showLinkStatistics(this._map, this)
        })

        this.on('mouseup', (e: LeafletMouseEvent) => {
            if (e.originalEvent.button === 1)
                this.fire('middlemouseclick', e)
        })
    }


    async update() {
        this.link.reorder()
        if (this.unit0.unit.id != this.link.unit0.id) {
            const temp = this.unit0
            this.unit0 = this.unit1
            this.unit1 = temp
        }
        const { values, stats } = await this.link.calculate()
        const endPoints = getEndPoints(this.unit0, this.unit1)
        this.setLatLngs(endPoints)
        let color = '#00ff0c', weight = 12
        if (stats.highestObstacle.height > -5) {
            color = '#00b9ff'
            weight = 8
        }
        if (stats.highestObstacle.height > 0) {
            color = '#ec2400'
            weight = 4
        }
        this.setStyle({
            weight,
            color
        })

        this.fire('update', { endPoints, values, stats })
    }
}


function getEndPoints(unit0: UnitLayer, unit1: UnitLayer) {
    return [unit0.getLatLng(), unit1.getLatLng()]
}