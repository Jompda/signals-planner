import { LatLng } from 'leaflet'
import { addUnit as structAddUnit, removeUnit as structRemoveUnit } from '../struct'
import UnitLayer from '../ui/components/unitlayer'
import { addUnit as lgAddUnit, getLinkLayersByUnitId, removeUnit as lgRemoveUnit } from '../ui/structurecontroller'
import Action from './action'
import { RemoveLinkAction } from './linkactions'
import { Symbol as MilSymbol } from 'milsymbol'


abstract class UnitAction extends Action {
    public unitLayer: UnitLayer
    constructor(unitLayer: UnitLayer) {
        super()
        this.unitLayer = unitLayer
    }
}


export class AddUnitAction extends UnitAction {
    forward() {
        structAddUnit(this.unitLayer.unit)
        lgAddUnit(this.unitLayer)
        this.dispatchEvent('structureUpdate')
        return this
    }
    reverse() {
        structRemoveUnit(this.unitLayer.unit)
        lgRemoveUnit(this.unitLayer)
        this.dispatchEvent('structureUpdate')
        return this
    }
}


export class RemoveUnitAction extends UnitAction {
    private removedLinks: Array<RemoveLinkAction>
    forward() {
        this.removedLinks = getLinkLayersByUnitId(this.unitLayer.unit.id)
            .map(linkLayer => new RemoveLinkAction(linkLayer).preventEventDispatch().forward())
        structRemoveUnit(this.unitLayer.unit)
        lgRemoveUnit(this.unitLayer)
        this.dispatchEvent('structureUpdate')
        return this
    }
    reverse() {
        structAddUnit(this.unitLayer.unit)
        lgAddUnit(this.unitLayer)
        for (const rmAction of this.removedLinks)
            rmAction.reverse()
        this.dispatchEvent('structureUpdate')
        return this
    }
}


export class MoveUnitAction extends UnitAction {
    protected latlng0: LatLng
    protected latlng1: LatLng
    constructor(unitLayer: UnitLayer, latlng0: LatLng, latlng1: LatLng) {
        super(unitLayer)
        this.latlng0 = latlng0
        this.latlng1 = latlng1
    }
    forward() {
        this.unitLayer.setUnitLatLng(this.latlng1)
        this.dispatchEvent('structureUpdate')
        return this
    }
    reverse() {
        this.unitLayer.setUnitLatLng(this.latlng0)
        this.dispatchEvent('structureUpdate')
        return this
    }
}


export class EditUnitAction extends MoveUnitAction {
    private symbol0: MilSymbol
    private symbol1: MilSymbol
    constructor(unitLayer: UnitLayer, latlng0: LatLng, latlng1: LatLng, symbol0: MilSymbol, symbol1: MilSymbol) {
        super(unitLayer, latlng0, latlng1)
        this.symbol0 = symbol0
        this.symbol1 = symbol1
    }
    forward() {
        this.unitLayer.setLatLngSymbol(this.latlng1, this.symbol1)
        this.dispatchEvent('structureUpdate')
        return this
    }
    reverse() {
        this.unitLayer.setLatLngSymbol(this.latlng0, this.symbol0)
        this.dispatchEvent('structureUpdate')
        return this
    }
}