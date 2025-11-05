import Action from './action'
import { RemoveUnitAction } from './unitactions'
import { getLinkLayers, getUnitLayerById, getUnitLayers } from '../ui/structurecontroller'
import UnitLayer from '../ui/components/unitlayer'
import LinkLayer from '../ui/components/linklayer'
import { RemoveLinksAction } from './linkactions'


interface LinkResolvable {
    unit0: UnitLayer
    unit1: UnitLayer
}


export default class ImportSolutionAction extends Action {
    private unitLayers: Array<RemoveUnitAction>
    private removeLinks: RemoveLinksAction
    constructor(solution: string) {
        super()
        this.unitLayers = new Array<RemoveUnitAction>()

        const keepEdges = new Array<LinkResolvable>()
        for (const row of solution.split(/\r?\n/)) {
            if (row.length == 0) continue
            const [unit0Id, unit1Id, cost] = row.split('|')
            keepEdges.push({
                unit0: getUnitLayerById(unit0Id),
                unit1: getUnitLayerById(unit1Id)
            })
        }

        const removeLinks = new Array<LinkLayer>()
        for (const linkLayer of getLinkLayers()) {
            if (!keepEdges.find(keep => {
                if (keep.unit0.unit.id == linkLayer.unit[0].unit.id && keep.unit1.unit.id == linkLayer.unit[1].unit.id) return true
                if (keep.unit0.unit.id == linkLayer.unit[1].unit.id && keep.unit1.unit.id == linkLayer.unit[0].unit.id) return true
                return false
            })) {
                removeLinks.push(linkLayer)
            }
        }
        this.removeLinks = new RemoveLinksAction(removeLinks).preventEventDispatch()

        for (const unitLayer of getUnitLayers())
            if (!keepEdges.find(keep => keep.unit0.unit.id == unitLayer.unit.id || keep.unit1.unit.id == unitLayer.unit.id))
                this.unitLayers.push(new RemoveUnitAction(unitLayer).preventEventDispatch())
    }
    forward() {
        this.removeLinks.forward()
        for (const unit of this.unitLayers) unit.forward()
        this.dispatchEvent('structureUpdate')
        return this
    }
    reverse() {
        for (const unit of this.unitLayers) unit.reverse()
        this.removeLinks.reverse()
        this.dispatchEvent('structureUpdate')
        return this
    }
}