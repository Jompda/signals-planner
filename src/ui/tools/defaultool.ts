import Tool from '../tool'
import { LeafletMouseEvent } from 'leaflet'
import { openTopographyPopup } from '../../topoutil'
import { getMap } from '../structurecontroller'


// <FontAwesomeIcon icon="fa-solid fa-draw-square" />
// <FontAwesomeIcon icon="fa-solid fa-object-union" />
// <FontAwesomeIcon icon="fa-solid fa-object-subtract" />
// <FontAwesomeIcon icon="fa-solid fa-object-group" />
class DefaultTool extends Tool {
    constructor() {
        super({
            icon: {
                tooltip: 'Default',
                className: 'fa fa-mouse-pointer'
            },
            mmbTopography: true
        })
    }
    middlemouseclick(e: LeafletMouseEvent) {
        if ((e.originalEvent.target as HTMLElement).id != 'map') return
        openTopographyPopup(getMap(), e.latlng)
    }
}
export default new DefaultTool()