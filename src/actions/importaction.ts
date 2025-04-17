import { Layer } from 'leaflet'
import { getDrawnLayers } from '../ui/geomancontroller'
import Link from '../struct/link'
import Unit from '../struct/unit'
import LinkLayer from '../ui/components/linklayer'
import UnitLayer from '../ui/components/unitlayer'
import Action from './action'
import { AddLinkAction } from './linkactions'
import { AddUnitAction } from './unitactions'
import { deselectAllUnitLayers } from '../ui/structurecontroller'


export default class ImportAction extends Action {
    private units: Array<AddUnitAction>
    private links: Array<AddLinkAction>
    private drawings?: Array<Layer>
    constructor(units: Array<Unit>, links: Array<Link>, drawings?: Array<Layer>) {
        super()
        this.drawings = drawings
        const unitLayers = new Array<UnitLayer>()
        function linkUnitResolver(unitId: string) {
            return unitLayers.find(unitLayer => unitLayer.unit.id == unitId)
        }

        this.units = new Array<AddUnitAction>()
        this.links = new Array<AddLinkAction>()
        for (const unit of units) {
            const unitLayer = new UnitLayer(unit)
            unitLayers.push(unitLayer)
            this.units.push(new AddUnitAction(unitLayer).preventEventDispatch())
        }
        for (const link of links)
            this.links.push(new AddLinkAction(new LinkLayer(link, linkUnitResolver(link.unit[0].id), linkUnitResolver(link.unit[1].id))).preventEventDispatch())
    }
    forward() {
        for (const unit of this.units) unit.forward()
        for (const link of this.links) link.forward()
        const drawnlayers = getDrawnLayers()
        if (this.drawings) for (const layer of this.drawings) drawnlayers.addLayer(layer)

        deselectAllUnitLayers()
        for (const unit of this.units) unit.unitLayer.select()

        this.dispatchEvent('structureUpdate')
        return this
    }
    reverse() {
        for (const unit of this.units) unit.unitLayer.deselect()

        for (const link of this.links) link.reverse()
        for (const unit of this.units) unit.reverse()
        const drawnlayers = getDrawnLayers()
        if (this.drawings) for (const layer of this.drawings) drawnlayers.removeLayer(layer)

        this.dispatchEvent('structureUpdate')
        return this
    }
}