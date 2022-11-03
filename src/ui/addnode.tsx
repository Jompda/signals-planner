import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as L from 'leaflet'
import { CoordsInput } from './components/coordsinput'
import { MilSymbolEditor } from './components/milsymboleditor'
import { Symbol as MilSymbol } from 'milsymbol'

export function showAddNodeMenu(map: L.Map, e: L.LeafletMouseEvent) {
    const dialog = (L.control as any).dialog({
        size: [400, 700],
        anchor: [innerHeight / 2 - 350, 0],
        position: "topleft",
        initOpen: true
    }).addTo(map)
    dialog.hideResize()

    const container = L.DomUtil.create('div')
    dialog.setContent(container)

    console.log('showing')

    let latlng: L.LatLng
    latlng = e.latlng
    let milSymbol: MilSymbol


    const root = createRoot(container)
    root.render(
        <div className='dialog-menu'>
            <h1>Add Node:</h1>
            <CoordsInput latlng={e.latlng} updateLatLng={(ll: L.LatLng) => latlng = ll} />
            <hr />
            <MilSymbolEditor updateMilSymbol={(s: MilSymbol) => milSymbol = s} />
            <hr />
            <button onClick={() => { console.log(latlng, milSymbol) }}>show</button>
        </div>
    )
}
