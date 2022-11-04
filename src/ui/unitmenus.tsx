import { createRoot } from 'react-dom/client'
import * as L from 'leaflet'
import { CoordsInput } from './components/coordsinput'
import { MilSymbolEditor } from './components/milsymboleditor'
import { Symbol as MilSymbol } from 'milsymbol'
import Unit from '../struct/unit'
import { addUnit as structAddUnit, unitIdExists } from '../struct'
import { addUnit as lgAddUnit } from './layercontroller'


let lastUnitId = 1

export function showAddUnitMenu(map: L.Map, e: L.LeafletMouseEvent) {
    const dialog = (L.control as any).dialog({
        size: [400, 700],
        anchor: [innerHeight / 2 - 350, 0],
        position: "topleft",
        initOpen: true
    }).addTo(map)
    dialog.hideResize()

    const container = L.DomUtil.create('div', 'dialog-menu')
    dialog.setContent(container)

    let latlng: L.LatLng
    latlng = e.latlng
    let milSymbol: MilSymbol
    milSymbol = new MilSymbol('SFGPU-------')

    const root = createRoot(container)
    root.render(
        <>
            <h1>Add Unit:</h1>
            <CoordsInput latlng={latlng} updateLatLng={(ll: L.LatLng) => latlng = ll} />
            <hr />
            <MilSymbolEditor milSymbol={milSymbol} updateMilSymbol={(s: MilSymbol) => milSymbol = s} />
            <hr />
            <div className='grower'></div>
            <div className='dialog-menu-submit'>
                <br />
                <button onClick={() => {
                    while (unitIdExists(String(lastUnitId))) lastUnitId++
                    const unit = new Unit({
                        id: String(lastUnitId++),
                        latlng,
                        symbol: milSymbol
                    })
                    structAddUnit(unit)
                    lgAddUnit(unit)
                    dialog.close()
                }}>Add</button>
                <button onClick={() => {
                    dialog.close()
                }}>Cancel</button>
            </div>
        </>
    )
}


export function showEditUnitMenu(map: L.Map, unit: Unit) {
    const dialog = (L.control as any).dialog({
        size: [400, 700],
        anchor: [innerHeight / 2 - 350, 0],
        position: "topleft",
        initOpen: true
    }).addTo(map)
    dialog.hideResize()

    const container = L.DomUtil.create('div', 'dialog-menu')
    dialog.setContent(container)

    let latlng: L.LatLng
    latlng = unit.layer.getLatLng()
    let milSymbol: MilSymbol
    milSymbol = new MilSymbol(unit.symbol.getOptions())

    const root = createRoot(container)
    root.render(
        <>
            <h1>Edit Unit:</h1>
            <CoordsInput latlng={latlng} updateLatLng={(ll: L.LatLng) => latlng = ll} />
            <hr />
            <MilSymbolEditor milSymbol={milSymbol} updateMilSymbol={(s: MilSymbol) => milSymbol = s} />
            <hr />
            <div className='grower'></div>
            <div className='dialog-menu-submit'>
                <br />
                <button onClick={() => {
                    unit.updateMarker(latlng, milSymbol)
                    dialog.close()
                }}>Save</button>
                <button onClick={() => {
                    dialog.close()
                }}>Cancel</button>
            </div>
        </>
    )
}
