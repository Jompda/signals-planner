import Tool from '../tool'
import { Symbol as MilSymbol } from 'milsymbol'
import { LeafletMouseEvent } from 'leaflet'
import Unit from '../../struct/unit'
import { addUnit as structAddUnit, getNewUnitId } from '../../struct'
import { addUnit as lgAddUnit, getMap } from '../structurecontroller'
import { openTopographyPopup } from '../../topoutil'
import UnitLayer from '../components/unitlayer'


class AddNodeTool extends Tool {
    public symbol: MilSymbol
    constructor() {
        const symbol = new MilSymbol({ sidc: 'SFGPUUS----B', size: 15 })
        super({
            icon: (
                <div className='toolbutton-icon' title='Add Node'>
                    <img src={symbol.toDataURL()} />
                </div>
            )
        })
        this.symbol = symbol
    }
    click(e: LeafletMouseEvent) {
        const symbol = new MilSymbol(this.symbol.getOptions(false))
        const unitId = getNewUnitId()
        symbol.setOptions({
            uniqueDesignation: unitId,
            higherFormation: 'Node'
        })
        const unitLayer = new UnitLayer(new Unit({
            id: unitId,
            latlng: e.latlng,
            symbol
        }))
        structAddUnit(unitLayer.unit)
        lgAddUnit(unitLayer)
    }
    middlemouseclick(e: LeafletMouseEvent) {
        openTopographyPopup(getMap(), e.latlng)
    }
}

export default new AddNodeTool()