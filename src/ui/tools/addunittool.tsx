import Tool from '../tool'
import { Symbol as MilSymbol, SymbolOptions } from 'milsymbol'
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


class AddUnitTool extends Tool {
    public symbol: MilSymbol
    public editDialog: LeafletDialog
    constructor() {
        const symbol = new MilSymbol({
            sidc: 'SFGPUUS----B',
            size: 15,
            higherFormation: 'Node',
            colorMode: 'Medium'
        })
        super({
            name: 'addunit',
            tooltip: 'Add Unit',
            icon: <img id='addunittool-icon' src={
                new MilSymbol(stripMilSymbolOptions(symbol.getOptions())).toDataURL()
            } />,
            items: [
                {
                    name: 'addunitedit',
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
        const soptions = this.symbol.getOptions()
        let unitId = getNewUnitId()
        if (!soptions.uniqueDesignation) soptions.uniqueDesignation = unitId
        const symbol = new MilSymbol(soptions)
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
            size: [400, 300],
            maxSize: [400, 400],
            minSize: [400, 300],
            anchor: [innerHeight / 2 - 175, innerWidth / 2 - 200],
            position: 'topleft',
            destroyOnClose: false
        })

        const container = DomUtil.create('div', 'dialog-menu')
        this.editDialog.setContent(container)
        createRoot(container).render(
            <>
                <h1>Add Unit Tool: edit</h1>
                <MilSymbolEditor
                    milSymbol={this.symbol}
                    updateMilSymbol={(s: MilSymbol) => {
                        this.symbol = s;
                        (document.getElementById('addunittool-icon') as HTMLImageElement).src = 
                            new MilSymbol(stripMilSymbolOptions(this.symbol.getOptions())).toDataURL()
                    }}
                />
            </>
        )
    }
}

function stripMilSymbolOptions(sopt: SymbolOptions) {
    sopt.uniqueDesignation = 
        sopt.higherFormation =
        sopt.reinforcedReduced =
        sopt.type =
        sopt.additionalInformation =
        sopt.dtg = undefined
    return sopt
}

export default new AddUnitTool()