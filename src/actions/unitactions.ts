import { addUnit as structAddUnit, removeUnit as structRemoveUnit } from '../struct'
import UnitLayer from '../ui/components/unitlayer'
import { addUnit as lgAddUnit, removeUnit as lgRemoveUnit } from '../ui/structurecontroller'


export class AddUnitAction {
    private unitLayer: UnitLayer
    constructor(unitLayer: UnitLayer) {
        this.unitLayer = unitLayer
    }
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


export class RemoveUnitAction {
    private unitLayer: UnitLayer
    constructor(unitLayer: UnitLayer) {
        this.unitLayer = unitLayer
    }
    forward() {
        structRemoveUnit(this.unitLayer.unit)
        lgRemoveUnit(this.unitLayer)
        return this
    }
    reverse() {
        structAddUnit(this.unitLayer.unit)
        lgAddUnit(this.unitLayer)
        return this
    }
}