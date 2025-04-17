import { createRoot } from 'react-dom/client'
import { Map as LMap, LeafletMouseEvent, DomUtil, LatLng } from 'leaflet'
import { CoordsInput } from '../components/coordsinput'
import { MilSymbolEditor } from '../components/milsymboleditor'
import { Symbol as MilSymbol } from 'milsymbol'
import Unit from '../../struct/unit'
import { getNewUnitId } from '../../struct'
import { createDialog } from '../../util'
import UnitLayer from '../components/unitlayer'
import { AddUnitAction, EditUnitAction } from '../../actions/unitactions'
import { addAction } from '../../actionhistory'


export function showAddUnitMenu(map: LMap, e: LeafletMouseEvent) {
    const dialog = createDialog(map, {
        size: [400, 450],
        maxSize: [400, 700],
        minSize: [400, 450],
        anchor: [innerHeight / 2 - 350, 0],
        position: 'topleft',
        initOpen: true
    })

    const container = DomUtil.create('div', 'dialog-menu')
    dialog.setContent(container)

    let latlng: LatLng
    latlng = e.latlng
    let milSymbol: MilSymbol
    milSymbol = new MilSymbol('SFGPU-------')

    const root = createRoot(container)
    root.render(
        <>
            <h1>Add Unit:</h1>
            <CoordsInput latlng={latlng} updateLatLng={(ll: LatLng) => latlng = ll} />
            <hr />
            <MilSymbolEditor milSymbol={milSymbol} updateMilSymbol={(s: MilSymbol) => milSymbol = s} />
            <hr />
            <div className='grower'></div>
            <div className='dialog-menu-submit'>
                <button onClick={() => {
                    addAction(new AddUnitAction(new UnitLayer(new Unit({
                        id: getNewUnitId(),
                        latlng: latlng || map.getCenter(),
                        symbol: milSymbol
                    }))).forward())
                    dialog.close()
                }}>Add</button>
                <button onClick={() => {
                    dialog.close()
                }}>Cancel</button>
            </div>
        </>
    )
}


export function showEditUnitMenu(map: LMap, unitLayer: UnitLayer) {
    const dialog = createDialog(map, {
        size: [400, 450],
        maxSize: [400, 700],
        minSize: [400, 450],
        anchor: [innerHeight / 2 - 350, 0],
        position: 'topleft',
        initOpen: true,
        onClose: onDialogClose
    })


    let latlng: LatLng
    latlng = unitLayer.unit.latlng
    let milSymbol: MilSymbol
    milSymbol = new MilSymbol(unitLayer.unit.symbol.getOptions())


    const container = DomUtil.create('div', 'dialog-menu')
    dialog.setContent(container)
    let root = createUI(container)


    unitLayer.on('update', onUnitUpdate)
    unitLayer.on('dragend', onUnitUpdate)
    unitLayer.on('remove', onUnitRemove)


    function onUnitUpdate() {
        latlng = unitLayer.unit.latlng
        milSymbol = new MilSymbol(unitLayer.unit.symbol.getOptions())
        root.unmount()
        root = createUI(container)
    }
    function onUnitRemove() {
        dialog.close()
    }
    function onDialogClose() {
        unitLayer.off('update', onUnitUpdate)
        unitLayer.off('dragend', onUnitUpdate)
        unitLayer.off('remove', onUnitRemove)
    }


    function createUI(container: HTMLElement) {
        const root = createRoot(container)

        root.render(
            <>
                <h1>Edit Unit:</h1>
                <CoordsInput latlng={latlng} updateLatLng={(ll: LatLng) => latlng = ll} />
                <hr />
                <MilSymbolEditor milSymbol={milSymbol} updateMilSymbol={(s: MilSymbol) => milSymbol = s} />
                <hr />
                <div className='grower'></div>
                <div className='dialog-menu-submit'>
                    <button onClick={() => {
                        addAction(new EditUnitAction(
                            unitLayer,
                            unitLayer.unit.latlng, latlng || map.getCenter(),
                            unitLayer.unit.symbol, milSymbol
                        ).forward())
                        dialog.close()
                    }}>Save</button>
                    <button onClick={() => {
                        dialog.close()
                    }}>Cancel</button>
                </div>
            </>
        )

        return root
    }
}