import Action from './action'
import { getLinkLayers, getUnitLayers } from '../ui/structurecontroller'
import { RemoveUnitAction } from './unitactions'
import { RemoveLinkAction } from './linkactions'


export default class RemoveAllAction extends Action {
    private units: Array<RemoveUnitAction>
    private links: Array<RemoveLinkAction>
    forward() {
        this.links = getLinkLayers().map(linkLayer => new RemoveLinkAction(linkLayer).forward())
        this.units = getUnitLayers().map(unitLayer => new RemoveUnitAction(unitLayer).forward())
        return this
    }
    reverse() {
        for (const unit of this.units) unit.reverse()
        for (const link of this.links) link.reverse()
        return this
    }
}