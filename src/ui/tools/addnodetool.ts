import Tool from '../tool'
import { Symbol as MilSymbol } from 'milsymbol'
import { LeafletMouseEvent } from 'leaflet'
import Unit from '../../struct/unit'
import { getNewUnitId } from '../../struct'
import { getMap, setUnitDragging } from '../structurecontroller'
import { openTopographyPopup } from '../../topoutil'
import UnitLayer from '../components/unitlayer'
import { addAction } from '../../actionhistory'
import { AddUnitAction } from '../../actions/unitactions'


class AddNodeTool extends Tool {
    public symbol: MilSymbol
    constructor() {
        const symbol = new MilSymbol({ sidc: 'SFGPUUS----B', size: 15 })
        super({
            icon: {
                tooltip: 'Add Nodes',
                html: `<div class="center-content"><img src="${symbol.toDataURL()}"/></div>`
            },
            actions: [
                {
                    icon: {
                        html: 'Edit'
                    },
                    enable: function () {
                        // TODO: Get new MilSymbol with MilSymbolEditor and switch the toolbar icon.
                        this.action.disable()
                    },
                }
            ],
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