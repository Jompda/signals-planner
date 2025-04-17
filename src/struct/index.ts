import Link from './link'
import Unit from './unit'
//import deepEqual from 'deep-equal'
import { SaveLink, SaveStructure, SaveUnit } from '../interfaces'
import { getSelectedUnits } from '../ui/structurecontroller'


const units = new Map<string, Unit>()
const links = new Map<string, Link>()


let lastUnitId = 1
export function getNewUnitId() {
    while (unitIdExists(String(lastUnitId))) lastUnitId++
    return String(lastUnitId)
}


export function getUnitById(id: string) {
    return units.get(id)
}
export function unitIdExists(id: string) {
    return units.has(id)
}
export function addUnit(unit: Unit) {
    if (unitIdExists(unit.id)) throw new Error('Unit id already exists!')
    units.set(unit.id, unit)
    return true
}
export function removeUnit(unit: Unit) {
    if (!units.delete(unit.id)) return false
    for (const link of getLinksByUnitId(unit.id)) {
        removeLink(link)
    }
    return true
}
export function getUnits() {
    return Array.from(units.values())
}


export function getLinksByUnitId(id: string) {
    const arr = []
    for (const link of links.values()) {
        if (link.unit[0].id == id || link.unit[1].id == id) arr.push(link)
    }
    return arr
}


export function getLinkById(id: string) {
    return links.get(id)
}
export function linkIdExists(id: string) {
    return links.has(id)
}
export function addLink(link: Link) {
    if (linkIdExists(link.id)) throw new Error('Link id already exists!')
    links.set(link.id, link)
    return true
}
export function removeLink(link: Link) {
    if (!links.delete(link.id)) return false
    return true
}
export function getLinks() {
    return Array.from(links.values())
}


export function serialize(selectionOnly: boolean) {
    const sUnits = new Array<SaveUnit>(), sLinks = new Array<SaveLink>()
    for (const unit of selectionOnly ? getSelectedUnits() : units.values())
        sUnits.push(unit.serialize())
    for (const link of links.values())
        if (sUnits.find(s => s.id === link.unit[0].id) && sUnits.find(s => s.id === link.unit[1].id))
            sLinks.push(link.serialize())
    return {
        units: sUnits,
        links: sLinks
    } as SaveStructure
}

// FIXME: Appears to be broken when importing same file the second time.
export function deserialize(obj: SaveStructure) {
    const pUnits = new Array<Unit>, pLinks = new Array<Link>
    const remappedIds = new Map<string, string>()

    for (const uObj of obj.units) {
        const unit = Unit.deserialize(uObj)
        // FIXME: After a couple conflicting import the ids have changed so much that a new import doesn't detect a conflict with a very old import the chain.
        if (unitIdExists(unit.id)) {
            const conflict = getUnitById(unit.id)
            /*if (
                !deepEqual(unit.latlng, conflict.latlng)
                || !deepEqual(unit.symbol.getOptions(false), conflict.symbol.getOptions(false))
            ) {*/
                let i = 1, lastId = unit.id
                while (unitIdExists((lastId = unit.id + (i ? `(${i})` : '')))) i++
                remappedIds.set(unit.id, lastId)
                unit.id = lastId
                pUnits.push(unit)
            //}
            //else remappedIds.set(unit.id, unit.id)
        } else {
            remappedIds.set(unit.id, unit.id)
            pUnits.push(unit)
        }
    }

    function linkUnitResolver(unitId: string) {
        return pUnits.find(unit => unit.id == unitId)
    }

    for (const lObj of obj.links) {
        lObj.unit0 = remappedIds.get(lObj.unit0)
        lObj.unit1 = remappedIds.get(lObj.unit1)
        const link = Link.deserialize(lObj, linkUnitResolver)
        if (linkIdExists(link.id)) continue
        pLinks.push(link)
    }

    return {
        ...obj,
        units: pUnits,
        links: pLinks,
    }
}