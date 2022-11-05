import { getMap } from '../ui/layercontroller'
import Link from './link'
import Unit from './unit'
import deepEqual from 'deep-equal'
import { SaveLink, SaveStructure, SaveUnit } from '../interfaces'


const units = new Map<string, Unit>()
const links = new Map<string, Link>()


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
        if (link.unit0.id == id || link.unit1.id == id) arr.push(link)
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


export function serialize() {
    const sUnits = new Array<SaveUnit>(), sLinks = new Array<SaveLink>()
    for (const unit of units.values())
        sUnits.push(unit.serialize())
    for (const link of links.values())
        sLinks.push(link.serialize())
    return {
        units: sUnits,
        links: sLinks,
        view: {
            center: getMap().getCenter(),
            zoom: getMap().getZoom()
        }
    } as SaveStructure
}

export function deserialize(obj: SaveStructure) {
    getMap().setView([obj.view.center.lat, obj.view.center.lng], obj.view.zoom)

    const pUnits = [], pLinks = []
    const remappedIds = new Map<string, string>()

    for (const uObj of obj.units) {
        const unit = Unit.deserialize(uObj)
        // FIXME: After a couple conflicting import the ids have changed so much that a new import doesn't detect a conflict with a very old import the chain.
        if (unitIdExists(unit.id)) {
            const conflict = getUnitById(unit.id)
            if (
                !deepEqual(unit.layer.getLatLng(), conflict.layer.getLatLng())
                || !deepEqual(unit.symbol.getOptions(false), conflict.symbol.getOptions(false))
            ) {
                let i = 1, lastId = unit.id
                while (unitIdExists((lastId = unit.id + (i ? `(${i})` : '')))) i++
                remappedIds.set(unit.id, lastId)
                unit.id = lastId
                addUnit(unit)
                pUnits.push(unit)
            }
            else remappedIds.set(unit.id, unit.id)
        } else {
            remappedIds.set(unit.id, unit.id)
            addUnit(unit)
            pUnits.push(unit)
        }
    }

    console.log(remappedIds)

    for (const lObj of obj.links) {
        lObj.unit0 = remappedIds.get(lObj.unit0)
        lObj.unit1 = remappedIds.get(lObj.unit1)
        const link = Link.deserialize(lObj)
        if (linkIdExists(link.id)) continue
        addLink(link)
        pLinks.push(link)
    }

    return {
        units: pUnits,
        links: pLinks
    }
}