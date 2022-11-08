import Tool from '../tool'
import { Symbol as MilSymbol } from 'milsymbol'
import { LeafletMouseEvent } from 'leaflet'
import Unit from '../../struct/unit'
import { addUnit as structAddUnit, unitIdExists } from '../../struct'
import { addUnit as lgAddUnit, getMap } from '../structurecontroller'
import { openTopographyPopup } from '../../topoutil'
import UnitLayer from '../components/unitlayer'


let lastUnitId = 0


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
        while (unitIdExists(String(lastUnitId))) lastUnitId++
        symbol.setOptions({
            uniqueDesignation: String(lastUnitId),
            higherFormation: 'Node'
        })
        const unitLayer = new UnitLayer(new Unit({
            id: String(lastUnitId++),
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