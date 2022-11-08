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
            icon: (
                <div className='toolbutton-icon' title='Cursor'>
                    <i className="fa fa-mouse-pointer"></i>
                </div>
            )
        })
    }
    async middlemouseclick(e: LeafletMouseEvent) {
        openTopographyPopup(getMap(), e.latlng)
    }
}
export default new DefaultTool()