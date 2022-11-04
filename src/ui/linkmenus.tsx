import * as L from 'leaflet'
import { createRoot } from 'react-dom/client'
import Link from '../struct/link'
import Unit from '../struct/unit'
import { addLink as structAddLink, getUnitById, getUnits, linkIdExists } from '../struct'
import { addLink as lgAddLink } from './layercontroller'
import { useRef } from 'react'


export function showAddLinkMenu(map: L.Map, unit0: Unit) {
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

    let unit1: Unit


    const root = createRoot(container)
    root.render(
        <>
            <h1>Add Link:</h1>
            <LinkContructor
                unit={unit0}
                updateTargetUnit={(unit1Id: string) => {
                    unit1 = getUnitById(unit1Id)
                }}
            />
            <hr />
            <div className='grower'></div>
            <div className='dialog-menu-submit'>
                <br />
                <button onClick={() => {
                    const linkId = Link.createId(unit0, unit1)
                    if (linkIdExists(linkId)) throw new Error('Link id already exists!')
                    const [u0, u1] = Link.orderUnits(unit0, unit1)
                    const link = new Link({
                        id: linkId,
                        unit0: u0,
                        unit1: u1
                    })
                    structAddLink(link)
                    lgAddLink(link)
                    dialog.close()
                }}>Add</button>
                <button onClick={() => {
                    dialog.close()
                }}>Cancel</button>
            </div>
        </>
    )
}


function LinkContructor(props: any) {
    const targetRef = useRef<HTMLSelectElement>()

    const unitOptions = getUnits()
        .filter(u => u.id != props.unit.id)
        .map(
            (u, i) => <option key={i} value={u.id}>{u.id}</option>
        )

    if (unitOptions.length > 0)
        props.updateTargetUnit(unitOptions[0].props.value)

    return (
        <>
            <select disabled>
                <option>{props.unit.id}</option>
            </select>
            <select
                ref={targetRef}
                onChange={() =>
                    props.updateTargetUnit(targetRef.current.value)
                }
            >{unitOptions}</select>
        </>
    )
}