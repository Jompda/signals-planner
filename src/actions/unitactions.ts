import { LatLng } from 'leaflet'
import { addUnit as structAddUnit, removeUnit as structRemoveUnit } from '../struct'
import UnitLayer from '../ui/components/unitlayer'
import { addUnit as lgAddUnit, getLinkLayersByUnitId, removeUnit as lgRemoveUnit } from '../ui/structurecontroller'
import Action from './action'
import { RemoveLinkAction } from './linkactions'


abstract class UnitAction extends Action {
    protected unitLayer: UnitLayer
    constructor(unitLayer: UnitLayer) {
        super()
        this.unitLayer = unitLayer
    }
}


export class AddUnitAction extends UnitAction {
    forward() {
        structAddUnit(this.unitLayer.unit)
        lgAddUnit(this.unitLayer)
        return this
    }
    reverse() {
        structRemoveUnit(this.unitLayer.unit)
        lgRemoveUnit(this.unitLayer)
        return this
    }
}


export class RemoveUnitAction extends UnitAction {
    private removedLinks: Array<RemoveLinkAction>
    forward() {
        this.removedLinks = getLinkLayersByUnitId(this.unitLayer.unit.id)
            .map(linkLayer => new RemoveLinkAction(linkLayer).forward())
        structRemoveUnit(this.unitLayer.unit)
        lgRemoveUnit(this.unitLayer)
        return this
    }
    reverse() {
        structAddUnit(this.unitLayer.unit)
        lgAddUnit(this.unitLayer)
        for (const rmAction of this.removedLinks)
            rmAction.reverse()
        return this
    }
}


export class MoveUnitAction extends UnitAction {
    private latlng0: LatLng
    private latlng1: LatLng
    constructor(unitLayer: UnitLayer, latlng0: LatLng, latlng1: LatLng) {
        super(unitLayer)
        this.latlng0 = latlng0
        this.latlng1 = latlng1
    }
    forward() {
        this.unitLayer.setUnitLatLng(this.latlng1)
        return this
    }
    reverse() {
        this.unitLayer.setUnitLatLng(this.latlng0)
        return this
    }
}