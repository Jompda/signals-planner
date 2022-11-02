import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as L from 'leaflet'

export function showAddNode(map: L.Map) {
    const dialog = (L.control as any).dialog({
        size: [300, 600],
        anchor: [innerHeight / 2 - 300, 0],
        position: "topleft",
        initOpen: true
    }).addTo(map)
    dialog.hideResize()

    const container = L.DomUtil.create('div')
    dialog.setContent(container)

    console.log('showing')

    const root = createRoot(container)
    root.render(<Counter />)
}

function Counter() {
    const [count, setCount] = useState(0)

    return (
        <>
            <h1>{count}</h1>
            <button onClick={() => setCount(count + 1)}>
                Yes
            </button>
        </>
    )
}