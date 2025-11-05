import { Map as LMap, DomUtil } from 'leaflet'
import { createRoot } from 'react-dom/client'
import Link from '../../struct/link'
import Unit from '../../struct/unit'
import { getUnits, linkIdExists } from '../../struct'
import { getUnitLayerById, structureEvents } from '../structurecontroller'
import { useRef, useState } from 'react'
import { createDialog } from '../../util'
import { v4 as uuidv4 } from 'uuid'
import UnitLayer from '../components/unitlayer'
import LinkLayer from '../components/linklayer'
import { addAction } from '../../actionhistory'
import { AddLinkAction, EditLinkAction } from '../../actions/linkactions'
import { MediumOptions } from '../components/mediumoptions'


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
    dialog.setContent(container)
    let root = createUI(container)

    let unit1: UnitLayer
    let medium: string
    let emitterHeight0: number, emitterHeight1: number

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
                    updateTargetUnit={(unit1Id: string) => unit1 = getUnitLayerById(unit1Id)}
                />
                <hr />
                <span>Type:</span>
                <MediumOptions
                    updateMedium={(value: string) => medium = value}
                    updateEmitterHeight0={value => emitterHeight0 = value}
                    updateEmitterHeight1={value => emitterHeight1 = value}
                />
                <div className='grower'></div>
                <div className='dialog-menu-submit'>
                    <button onClick={() => {
                        if (!unit1) return // Tell user to select link.
                        if (linkIdExists(Link.createId(unitLayer0.unit, unit1.unit))) throw new Error('Link id already exists!')
                        const link = new Link({ unit0: unitLayer0.unit, unit1: unit1.unit, emitterHeight0, emitterHeight1, medium })
                        const linkLayer = new LinkLayer(link, getUnitLayerById(link.unit[0].id), getUnitLayerById(link.unit[1].id))
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
    let emitterHeight0: number, emitterHeight1: number

    function createUI(container: HTMLElement) {
        const root = createRoot(container)
        root.render(
            <>
                <h1>Edit Link:</h1>
                <span>Source:</span>
                <select disabled>
                    <option>{linkLayer.unit[0].unit.unitIdentifier(true)}</option>
                </select>
                <span>Target:</span>
                <select disabled>
                    <option>{linkLayer.unit[1].unit.unitIdentifier(true)}</option>
                </select>
                <hr />
                <span>Type:</span>
                <MediumOptions
                    defaultMedium={linkLayer.link.medium.name}
                    updateMedium={(value: string) => medium = value}
                    defaultEmitterHeight0={linkLayer.link.emitterHeight[0]}
                    updateEmitterHeight0={value => emitterHeight0 = value}
                    defaultEmitterHeight1={linkLayer.link.emitterHeight[1]}
                    updateEmitterHeight1={value => emitterHeight1 = value}
                />
                <div className='grower'></div>
                <div className='dialog-menu-submit'>
                    <button onClick={() => {
                        addAction(new EditLinkAction(
                            linkLayer,
                            linkLayer.link.medium,
                            linkLayer.link.emitterHeight[0],
                            linkLayer.link.emitterHeight[1],
                            medium,
                            emitterHeight0,
                            emitterHeight1
                        ).forward())
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


function LinkContructor({ unit, updateTargetUnit }: {
    unit: Unit
    updateTargetUnit: (id: string) => any
}) {
    const units = getUnits().filter(u => u.id != unit.id)
    return (
        <>
            <span>Source:</span>
            <select disabled>
                <option>
                    {unit.unitIdentifier(true)}
                </option>
            </select>
            <span>Target:</span>
            <UnitSelector
                units={units}
                updateTargetUnit={updateTargetUnit}
            />
        </>
    )
}


function UnitSelector({ units, updateTargetUnit }: {
    units: Array<Unit>
    updateTargetUnit: (id: string) => any
}) {
    const searchRef = useRef<HTMLInputElement>()
    const [filter, setFilter] = useState('')
    const [selected, setSelected] = useState('')
    const id = uuidv4()

    const unitElements = units.map((u: Unit, i: number) => {
        const str = u.unitIdentifier(true)
        if (str.toLowerCase().indexOf(filter) < 0) return undefined
        return (
            <label key={i} className='unit-selector-button'>
                <input
                    name={id}
                    type='radio'
                    defaultChecked={u.id == selected}
                    onClick={() => {
                        updateTargetUnit(u.id)
                        setSelected(u.id)
                    }}
                />
                <div>
                    <img
                        src={u.symbol.toDataURL()}
                        style={{height: '2em'}}
                    />
                    <p>| {str}</p>
                </div>
            </label>
        )
    }).filter((el?: JSX.Element) => el)

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
                {unitElements}
            </div>
        </>
    )
}
