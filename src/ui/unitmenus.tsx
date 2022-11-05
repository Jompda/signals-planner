import { createRoot } from 'react-dom/client'
import * as L from 'leaflet'
import { CoordsInput } from './components/coordsinput'
import { MilSymbolEditor } from './components/milsymboleditor'
import { Symbol as MilSymbol } from 'milsymbol'
import Unit from '../struct/unit'
import { addUnit as structAddUnit, unitIdExists } from '../struct'
import { addUnit as lgAddUnit } from './layercontroller'
import { v4 as uuidv4 } from 'uuid'
import { useState } from 'react'


let lastUnitId = 1


export function showAddUnitMenu(map: L.Map, e: L.LeafletMouseEvent) {
    const dialog = (L.control as any).dialog({
        size: [400, 700],
        maxSize: [400, 700],
        minSize: [400, 400],
        anchor: [innerHeight / 2 - 350, 0],
        position: "topleft",
        initOpen: true
    }).addTo(map)

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
                        latlng: latlng || map.getCenter(),
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


/**
 * # TODO: Add bind between Unit and showEditUnitMenu
 * Should close when the bound unit gets removed.
 * Should get updated when the bound unit get updated.
 */
export function showEditUnitMenu(map: L.Map, unit: Unit) {
    const dialog = (L.control as any).dialog({
        size: [400, 700],
        maxSize: [400, 700],
        minSize: [400, 400],
        anchor: [innerHeight / 2 - 350, 0],
        position: "topleft",
        initOpen: true
    }).addTo(map)
    dialog.identifier = uuidv4()


    let latlng: L.LatLng
    latlng = unit.layer.getLatLng()
    let milSymbol: MilSymbol
    milSymbol = new MilSymbol(unit.symbol.getOptions())


    function onUnitUpdate() {
        console.log('updateUI')
        latlng = unit.layer.getLatLng()
        milSymbol = new MilSymbol(unit.symbol.getOptions())
        console.log('latlng', latlng)
        updateUI({ latlng, milSymbol })
    }
    function onUnitRemove() {
        console.log('unitremoved')
    }
    function onDialogClose(element: any) {
        if (element.identifier != dialog.identifier) return
        unit.layer.off('update', onUnitUpdate)
        unit.layer.off('dragend', onUnitUpdate)
        unit.layer.off('remove', onUnitRemove)
        map.off('dialog:closed', onDialogClose)
        dialog.destroy()
    }

    unit.layer.on('update', onUnitUpdate)
    unit.layer.on('dragend', onUnitUpdate)
    unit.layer.on('remove', onUnitRemove)
    map.on('dialog:closed', onDialogClose)


    const container = L.DomUtil.create('div', 'dialog-menu')
    const root = createRoot(container)
    dialog.setContent(container)

    let updateUI: Function

    root.render(
        <Ui
            callback={(func: Function) => updateUI = func}
            unit={unit}
            latlng={latlng}
            milSymbol={milSymbol}
            map={map}
            dialog={dialog}
            updateLatLng={(ll: L.LatLng) => latlng = ll}
            updateMilSymbol={(s: MilSymbol) => milSymbol = s}
        />
    )
}


function Ui(props: any) {

    const [state, setState] = useState({ latlng: props.latlng, milSymbol: props.milSymbol })
    props.callback((data: any) => {
        console.log('setstate')
        setState(d => data)
        console.log(data, state) // FUCKED
    })

    return (
        <>
            <h1>Edit Unit:</h1>
            <CoordsInput latlng={state.latlng} updateLatLng={props.updateLatLng} />
            <hr />
            <MilSymbolEditor milSymbol={state.milSymbol} updateMilSymbol={props.updateMilSymbol} />
            <hr />
            <div className='grower'></div>
            <div className='dialog-menu-submit'>
                <br />
                <button onClick={() => {
                    props.unit.updateMarker(props.latlng || props.map.getCenter(), props.milSymbol)
                    props.dialog.close()
                }}>Save</button>
                <button onClick={() => {
                    props.dialog.close()
                }}>Cancel</button>
            </div>
        </>
    )
}