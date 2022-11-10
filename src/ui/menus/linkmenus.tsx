import { Map as LMap, DomUtil, DomEvent } from 'leaflet'
import { createRoot } from 'react-dom/client'
import Link from '../../struct/link'
import Unit from '../../struct/unit'
import { addLink as structAddLink, getUnits, linkIdExists } from '../../struct'
import { addLink as lgAddLink, getUnitById, structureEvents } from '../structurecontroller'
import { useRef, useState } from 'react'
import { createDialog, symbolToHierarchyString } from '../../util'
import { v4 as uuidv4 } from 'uuid'
import UnitLayer from '../components/unitlayer'
import LinkLayer from '../components/linklayer'


export function showAddLinkMenu(map: LMap, unit0: UnitLayer) {
    const dialog = createDialog(map, {
        size: [400, 400],
        maxSize: [400, 700],
        minSize: [400, 400],
        anchor: [innerHeight / 2 - 350, 0],
        position: 'topleft',
        initOpen: true,
        onClose: onDialogClose
    })

    const container = DomUtil.create('div', 'dialog-menu')
    DomEvent.disableClickPropagation(container)
    DomEvent.disableScrollPropagation(container)
    dialog.setContent(container)
    let root = createUI(container)

    let unit1: UnitLayer

    structureEvents.addEventListener('updateunit', onUpdateUnits)
    structureEvents.addEventListener('addunit', onUpdateUnits)
    structureEvents.addEventListener('removeunit', onUpdateUnits)
    unit0.on('remove', onUnitRemove)

    function onUpdateUnits() {
        console.log('updateunits')
        root.unmount()
        root = createUI(container)
    }
    function onUnitRemove() {
        dialog.close()
    }
    function onDialogClose() {
        structureEvents.removeEventListener('updateunit', onUpdateUnits)
        structureEvents.removeEventListener('addunit', onUpdateUnits)
        structureEvents.removeEventListener('removeunit', onUpdateUnits)
        unit0.off('remove', onUnitRemove)
    }


    function createUI(container: HTMLElement) {
        const root = createRoot(container)
        root.render(
            <>
                <h1>Add Link:</h1>
                <LinkContructor
                    unit={unit0.unit}
                    updateTargetUnit={(unit1Id: string) =>
                        unit1 = getUnitById(unit1Id)
                    }
                />
                <hr />
                <div className='grower'></div>
                <div className='dialog-menu-submit'>
                    <br />
                    <button onClick={() => {
                        if (!unit1) return // Tell user to select link.
                        if (linkIdExists(Link.createId(unit0.unit, unit1.unit))) throw new Error('Link id already exists!')
                        const link = new Link({
                            unit0: unit0.unit,
                            unit1: unit1.unit
                        })
                        const linkLayer = new LinkLayer(link, getUnitById(link.unit0.id), getUnitById(link.unit1.id))
                        structAddLink(linkLayer.link)
                        lgAddLink(linkLayer)
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
    const units = getUnits().filter(u => u.id != props.unit.id)
    return (
        <>
            <select disabled>
                <option>
                    {props.unit.toHierarchyString()}
                </option>
            </select>
            <UnitSelector
                units={units}
                updateTargetUnit={props.updateTargetUnit}
            />
        </>
    )
}


function UnitSelector(props: any) {
    const searchRef = useRef<HTMLInputElement>()
    const [filter, setFilter] = useState('')
    const [selected, setSelected] = useState('')
    const id = uuidv4()

    const units = props.units.map((u: Unit, i: number) => {
        const str = u.toHierarchyString()
        if (str.toLowerCase().indexOf(filter) < 0) return undefined
        return (
            <label key={i} className='unit-selector-button'>
                <input
                    name={id}
                    type='radio'
                    defaultChecked={u.id == selected}
                    onClick={() => {
                        props.updateTargetUnit(u.id)
                        setSelected(u.id)
                    }}
                />
                <div><p>{str}</p></div>
            </label>
        )
    }).filter((el: any) => el)

    return (
        <>
            <input
                ref={searchRef}
                type='text'
                onKeyUp={() => {
                    setFilter(searchRef.current.value.toLowerCase())
                }}
            />
            <div className='unit-selector-target-units-container'>
                {units}
            </div>
        </>
    )
}