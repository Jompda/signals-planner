import Tool from '../tool'
import { LatLngBounds, LeafletMouseEvent } from 'leaflet'
import { openTopographyPopup } from '../../topoutil'
import { getMap, getUnitLayers } from '../structurecontroller'


// <FontAwesomeIcon icon="fa-solid fa-draw-square" />
// <FontAwesomeIcon icon="fa-solid fa-object-union" />
// <FontAwesomeIcon icon="fa-solid fa-object-subtract" />
// <FontAwesomeIcon icon="fa-solid fa-object-group" />
class DefaultTool extends Tool {
    constructor() {
        super({
            tooltip: 'Default',
            icon: <i className='fa fa-mouse-pointer' />,
            mmbTopography: true,
            areaSelect: true
        })
    }
    middlemouseclick(e: LeafletMouseEvent) {
        if ((e.originalEvent.target as HTMLElement).id != 'map') return
        openTopographyPopup(getMap(), e.latlng)
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