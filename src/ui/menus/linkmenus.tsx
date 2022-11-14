import { Map as LMap, DomUtil, DomEvent } from 'leaflet'
import { createRoot } from 'react-dom/client'
import Link from '../../struct/link'
import Unit from '../../struct/unit'
import { getUnits, linkIdExists } from '../../struct'
import { getUnitById, structureEvents } from '../structurecontroller'
import { useRef, useState } from 'react'
import { createDialog } from '../../util'
import { v4 as uuidv4 } from 'uuid'
import UnitLayer from '../components/unitlayer'
import LinkLayer from '../components/linklayer'
import { addAction } from '../../actionhistory'
import { AddLinkAction, EditLinkAction } from '../../actions/linkactions'
import { cables, radios } from '../../struct/medium'


export function showAddLinkMenu(map: LMap, unitLayer0: UnitLayer) {
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
    let medium: string

    structureEvents.addEventListener('updateunit', onUpdateUnits)
    structureEvents.addEventListener('addunit', onUpdateUnits)
    structureEvents.addEventListener('removeunit', onUpdateUnits)
    unitLayer0.on('remove', onUnitRemove)

    function onUpdateUnits() {
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
        unitLayer0.off('remove', onUnitRemove)
    }


    function createUI(container: HTMLElement) {
        const root = createRoot(container)
        root.render(
            <>
                <h1>Add Link:</h1>
                <LinkContructor
                    unit={unitLayer0.unit}
                    updateTargetUnit={(unit1Id: string) => unit1 = getUnitById(unit1Id)}
                />
                <hr />
                <span>Type:</span>
                <MediumSelector
                    updateMedium={(value: string) => medium = value}
                />
                <div className='grower'></div>
                <div className='dialog-menu-submit'>
                    <button onClick={() => {
                        if (!unit1) return // Tell user to select link.
                        if (linkIdExists(Link.createId(unitLayer0.unit, unit1.unit))) throw new Error('Link id already exists!')
                        const link = new Link({ unit0: unitLayer0.unit, unit1: unit1.unit, medium })
                        const linkLayer = new LinkLayer(link, getUnitById(link.unit0.id), getUnitById(link.unit1.id))
                        addAction(new AddLinkAction(linkLayer).forward())
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


export function showEditLinkMenu(map: LMap, linkLayer: LinkLayer) {
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

    linkLayer.on('update', onUpdateLink)
    linkLayer.on('remove', onLinkRemove)

    function onUpdateLink() {
        root.unmount()
        root = createUI(container)
    }
    function onLinkRemove() {
        dialog.close()
    }
    function onDialogClose() {
        linkLayer.off('update', onUpdateLink)
        linkLayer.off('remove', onLinkRemove)
    }

    let medium: string


    function createUI(container: HTMLElement) {
        const root = createRoot(container)
        root.render(
            <>
                <h1>Edit Link:</h1>
                <span>Source:</span>
                <select disabled>
                    <option>{unitIdentifier(linkLayer.unit0.unit)}</option>
                </select>
                <span>Target:</span>
                <select disabled>
                    <option>{unitIdentifier(linkLayer.unit1.unit)}</option>
                </select>
                <hr />
                <span>Type:</span>
                <MediumSelector
                    defaultValue={linkLayer.link.medium.name}
                    updateMedium={(value: string) => medium = value}
                />
                <div className='grower'></div>
                <div className='dialog-menu-submit'>
                    <button onClick={() => {
                        addAction(new EditLinkAction(linkLayer, linkLayer.link.medium, medium).forward())
                        dialog.close()
                    }}>Apply</button>
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
            <span>Source:</span>
            <select disabled>
                <option>
                    {unitIdentifier(props.unit)}
                </option>
            </select>
            <span>Target:</span>
            <UnitSelector
                units={units}
                updateTargetUnit={props.updateTargetUnit}
            />
        </>
    )
}


function unitIdentifier(unit: Unit) {
    const hstring = unit.toHierarchyString()
    const opt = unit.symbol.getOptions(false)

    if (isNaN(parseInt(opt.uniqueDesignation))) return hstring
    if (opt.higherFormation != 'Node') return hstring
    return 'Node ' + opt.uniqueDesignation
}


function UnitSelector(props: any) {
    const searchRef = useRef<HTMLInputElement>()
    const [filter, setFilter] = useState('')
    const [selected, setSelected] = useState('')
    const id = uuidv4()

    const units = props.units.map((u: Unit, i: number) => {
        const str = unitIdentifier(u)
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


function MediumSelector(props: any) {
    const selectRef = useRef<HTMLSelectElement>()
    let first: string

    const radioGroup = new Array<JSX.Element>()
    const cableGroup = new Array<JSX.Element>()
    for (const radio of radios.values()) {
        if (!first) first = radio.name
        radioGroup.push(
            <option
                key={radio.name}
                value={radio.name}
            >{radio.name}: {radio.frequency}MHz {radio.beamWidth ? 'Directing ' + radio.beamWidth + '°' : ''}</option>
        )
    }
    for (const cable of cables.values()) {
        if (!first) first = cable.name
        cableGroup.push(
            <option
                key={cable.name}
                value={cable.name}
            >{cable.name}: {cable.cableLength}m {cable.resistivity}Ω</option>
        )
    }

    props.updateMedium(props.defaultValue || first)

    return (
        <select
            ref={selectRef}
            defaultValue={props.defaultValue}
            onChange={() => props.updateMedium(selectRef.current.value)}
        >
            <optgroup label='Radios'>{radioGroup}</optgroup>
            <optgroup label='Cables'>{cableGroup}</optgroup>
        </select>
    )
}


function LinkEditor(props: any) {

}


function CableEditor(props: any) {

}