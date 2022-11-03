import { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as mgrs from 'mgrs'
import * as L from 'leaflet'
import { CoordsInput } from './components/coordsinput'

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

    const state = {
        latlng: e.latlng
    }

    const root = createRoot(container)
    root.render(
        <div className='dialog-menu'>
            <h1>Add Node:</h1>
            <CoordsInput latlng={e.latlng} updateLatLng={(latlng: L.LatLng) => state.latlng = latlng} />
            <br />
            <button onClick={() => { console.log(state) }}>show</button>
            <Counter />
        </div>
    )
}




function Counter() {
    const [count, setCount] = useState(0)

    return (
        <>
            <p>{count}</p>
            <button onClick={() => setCount(count + 1)}>
                Yes
            </button>
        </>
    )
}