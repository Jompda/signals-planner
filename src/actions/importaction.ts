import Link from '../struct/link'
import Unit from '../struct/unit'
import LinkLayer from '../ui/components/linklayer'
import UnitLayer from '../ui/components/unitlayer'
import { getUnitById } from '../ui/structurecontroller'
import Action from './action'
import { AddLinkAction } from './linkactions'
import { AddUnitAction } from './unitactions'


export default class ImportAction extends Action {
    private units: Array<AddUnitAction>
    private links: Array<AddLinkAction>
    constructor(units: Array<Unit>, links: Array<Link>) {
        super()
        this.units = new Array<AddUnitAction>()
        this.links = new Array<AddLinkAction>()
        for (const unit of units)
            this.units.push(new AddUnitAction(new UnitLayer(unit)))
        for (const link of links) {
            this.links.push(new AddLinkAction(new LinkLayer(link, getUnitById(link.unit0.id), getUnitById(link.unit1.id))))
        }
    }
    forward() {
        for (const unit of this.units)
            unit.forward()
        for (const link of this.links)
            link.forward()
        return this
    }
    reverse() {
        for (const link of this.links)
            link.reverse()
        for (const unit of this.units)
            unit.reverse()
        return this
    }
}