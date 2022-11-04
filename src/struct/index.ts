import Link from './link'
import Unit from './unit'


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
