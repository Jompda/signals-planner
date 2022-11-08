import { Polyline } from 'leaflet'
import { ExtendedLayerOptions } from '../../interfaces'
import { removeLink as structRemoveLink } from '../../struct'
import Link from '../../struct/link'
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
    }


    update() {
        const endPoints = getEndPoints(this.unit0, this.unit1)
        this.setLatLngs(endPoints)
        this.link.calculate()
        this.fire('update', { endPoints })
    }
}


function getEndPoints(unit0: UnitLayer, unit1: UnitLayer) {
    return [unit0.getLatLng(), unit1.getLatLng()]
}