import { Map as LMap, DomUtil, control } from 'leaflet'
import { createRoot } from 'react-dom/client'
import Link from '../../struct/link'
import Unit from '../../struct/unit'
import { addLink as structAddLink, getUnitById, getUnits, linkIdExists } from '../../struct'
import { addLink as lgAddLink } from '../structurecontroller'
import { useRef } from 'react'
import { symbolToHierarchyString } from '../../util'
import { v4 as uuidv4 } from 'uuid'


export function showAddLinkMenu(map: LMap, unit0: Unit) {
    const dialog = (control as any).dialog({
        size: [400, 700],
        maxSize: [400, 700],
        minSize: [400, 400],
        anchor: [innerHeight / 2 - 350, 0],
        position: "topleft",
        initOpen: true
    }).addTo(map)
    dialog.identifier = uuidv4()

    const container = DomUtil.create('div', 'dialog-menu')
    dialog.setContent(container)
    let root = createUI(container)

    let unit1: Unit

    unit0.layer.on('update', onUnitUpdate)
    unit0.layer.on('remove', onUnitRemove)
    map.on('dialog:closed', onDialogClose)

    function onUnitUpdate() {
        root.unmount()
        root = createUI(container)
    }
    function onUnitRemove() {
        dialog.close()
    }
    function onDialogClose(element: any) {
        if (element.identifier != dialog.identifier) return
        unit0.layer.off('update', onUnitUpdate)
        unit0.layer.off('remove', onUnitRemove)
        map.off('dialog:closed', onDialogClose)
        dialog.destroy()
    }


    function createUI(container: HTMLElement) {
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
                        if (linkIdExists(Link.createId(unit0, unit1))) throw new Error('Link id already exists!')
                        const [u0, u1] = Link.orderUnits(unit0, unit1)
                        const link = new Link({
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
        return root
    }
}


function LinkContructor(props: any) {
    const targetRef = useRef<HTMLSelectElement>()

    const unitOptions = getUnits()
        .filter(u => u.id != props.unit.id)
        .map(
            (u, i) =>
                <option key={i}>
                    {symbolToHierarchyString(u.symbol, u.id)}
                </option>
        )

    if (unitOptions.length > 0)
        props.updateTargetUnit(unitOptions[0].props.value)

    return (
        <>
            <select disabled>
                <option>
                    {symbolToHierarchyString(props.unit.symbol, props.unit.id)}
                </option>
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