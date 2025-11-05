import Tool from '../tool'
import { LatLngBounds, LeafletMouseEvent } from 'leaflet'
import { getUnitLayers } from '../structurecontroller'


// <FontAwesomeIcon icon="fa fa-draw-square" />
// <FontAwesomeIcon icon="fa fa-object-union" />
// <FontAwesomeIcon icon="fa fa-object-subtract" />
// <FontAwesomeIcon icon="fa fa-object-group" />
class DefaultTool extends Tool {
    constructor() {
        super({
            name: 'default',
            tooltip: 'Default',
            icon: <i className='fa fa-mouse-pointer' />,
            mmbInfo: true,
            areaSelect: true
        })
    }
    bboxselect(e: LeafletMouseEvent, bounds: LatLngBounds) {
        const unitLayers = getUnitLayers()
        const containedUnitLayers = unitLayers.filter(unitLayer => bounds.contains(unitLayer.getLatLng()))
        if (!e.originalEvent.shiftKey) {
            for (const unitLayer of unitLayers)
                unitLayer.deselect()
        }
        for (const unitLayer of containedUnitLayers)
            unitLayer.select()
    }
}
export default new DefaultTool()