import Link from "./link"
import Unit from "./unit"


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
    //unit.remove()
    //deselecUnit(unit)
    return true
}
export function getUnits() {
    return Array.from(units.values())
}
/*export function setUnitDragging(state: boolean) {
    if (state) for (const unit of units) unit.layer.dragging.enable()
    else for (const unit of units) unit.layer.dragging.disable()
}*/


export function getLinkById(id: string) {
    return links.get(id)
}
export function linkIdExists(id: string) {
    return units.has(id)
}
export function addLink(link: Link) {
    if (linkIdExists(link.id)) throw new Error('Link id already exists!')
    links.set(link.id, link)
    return true
}





