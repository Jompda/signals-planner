import Tool from '../tool'
import { Symbol as MilSymbol } from 'milsymbol'
import { DomUtil, LeafletMouseEvent } from 'leaflet'
import Unit from '../../struct/unit'
import { getNewUnitId } from '../../struct'
import UnitLayer from '../components/unitlayer'
import { addAction } from '../../actionhistory'
import { AddUnitAction } from '../../actions/unitactions'
import { MilSymbolEditor } from '../components/milsymboleditor'
import { createDialog } from '../../util'
import { getMap } from '../structurecontroller'
import { createRoot } from 'react-dom/client'
import { LeafletDialog } from '../../interfaces'


class AddNodeTool extends Tool {
    public symbol: MilSymbol
    public editDialog: LeafletDialog
    constructor() {
        const symbol = new MilSymbol({ sidc: 'SFGPUUS----B', size: 15 })
        super({
            tooltip: 'Add Node',
            icon: <img id='addnotetool-icon' src={symbol.toDataURL()} />,
            items: [
                {
                    icon: 'Edit',
                    radio: false,
                    addHooks: () => {
                        if (!this.editDialog) this.createEditMenu()
                        this.editDialog.open()
                    },
                }
            ],
            mmbInfo: true
        })
        this.symbol = symbol
    }
    _click(e: LeafletMouseEvent) {
        const symbol = new MilSymbol(this.symbol.getOptions())
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
        addAction(new AddUnitAction(unitLayer).forward())
        unitLayer.select()
    }
    createEditMenu() {
        this.editDialog = createDialog(getMap(), {
            size: [600, 500],
            maxSize: [600, 700],
            minSize: [600, 400],
            anchor: [innerHeight / 2 - 300, innerWidth / 2 - 300],
            position: 'topleft',
            destroyOnClose: false
        })

        const container = DomUtil.create('div', 'dialog-menu')
        this.editDialog.setContent(container)
        createRoot(container).render(
            <MilSymbolEditor
                milSymbol={this.symbol}
                updateMilSymbol={(s: MilSymbol) => {
                    this.symbol = s;
                    (document.getElementById('addnotetool-icon') as HTMLImageElement).src = this.symbol.toDataURL()
                }}
            />
        )
    }
}

export default new AddNodeTool()