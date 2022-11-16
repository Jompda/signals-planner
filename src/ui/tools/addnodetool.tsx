import Tool from '../tool'
import { Symbol as MilSymbol } from 'milsymbol'
import { LeafletMouseEvent } from 'leaflet'
import Unit from '../../struct/unit'
import { getNewUnitId } from '../../struct'
import { getMap } from '../structurecontroller'
import { openTopographyPopup } from '../../topoutil'
import UnitLayer from '../components/unitlayer'
import { addAction } from '../../actionhistory'
import { AddUnitAction } from '../../actions/unitactions'


class AddNodeTool extends Tool {
    public symbol: MilSymbol
    constructor() {
        const symbol = new MilSymbol({ sidc: 'SFGPUUS----B', size: 15 })
        super({
            icon: (
                <div className='toolbutton-icon' title='Add Node'>
                    <img src={symbol.toDataURL()} />
                </div>
            ),
            unitSelecting: true,
            mmbTopography: true
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
        addAction(new AddUnitAction(new UnitLayer(new Unit({
            id: unitId,
            latlng: e.latlng,
            symbol
        }))).forward())
    }
    middlemouseclick(e: LeafletMouseEvent) {
        openTopographyPopup(getMap(), e.latlng)
    }
}

export default new AddNodeTool()