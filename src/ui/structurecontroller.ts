import { Map as LMap, LayerGroup } from 'leaflet'
import { getLinksByUnitId, getUnitById } from '../struct'
import UnitLayer from './components/unitlayer'
import LinkLayer from './components/linklayer'
import Unit from '../struct/unit'
import Link from '../struct/link'


const unitLayers = new LayerGroup<UnitLayer>()
const linkLayers = new LayerGroup<LinkLayer>()


export function getUnitLayers() {
    return unitLayers.getLayers() as Array<UnitLayer>
}
export function getLinkLayers() {
    return linkLayers.getLayers() as Array<LinkLayer>
}


export function getUnitLayerById(unitId: string) {
    return (unitLayers.getLayers() as Array<UnitLayer>).find(u => u.unit.id == unitId)
}
export function getLinkLayerById(linkId: string) {
    return (linkLayers.getLayers() as Array<LinkLayer>).find(l => l.link.id == linkId)
}

export function getLinkLayersByUnitId(unitId: string) {
    const linkLayers = new Array<LinkLayer>()
    for (const link of getLinksByUnitId(unitId))
        linkLayers.push(getLinkLayerById(link.id))
    return linkLayers
}

export function getLinkLayersByUnitLayers(unitLayers: Array<UnitLayer>) {
    const linkLayers = new Array<LinkLayer>()
    for (let i = 0; i < unitLayers.length; i++) {
        for (let j = i + 1; j < unitLayers.length; j++) {
            const linkId = Link.createId(unitLayers[i].unit, unitLayers[j].unit)
            const linkLayer = getLinkLayerById(linkId)
            if (linkLayer) linkLayers.push(linkLayer)
        }
    }
    return linkLayers
}


export const structureEvents = new EventTarget()


let _map: LMap
export function addTo(map: LMap) {
    _map = map
    map.addLayer(linkLayers)
    map.addLayer(unitLayers)
}
export function remove() {
    unitLayers.remove()
    linkLayers.remove()
}
export function getMap() {
    return _map
}


let unitInteraction = true
export function isUnitInteractionEnabled() {
    return unitInteraction
}
export function setUnitInteraction(state: boolean) {
    unitInteraction = state;
    unitLayers.setInteractive(state)
}


let unitDragging = true
export function isUnitDraggingEnabled() {
    return unitDragging
}
export function setUnitDragging(state: boolean) {
    unitDragging = state;
    unitLayers.setDraggable(state)
}


let linkInteraction = true
export function isLinkInteractionEnabled() {
    return linkInteraction
}
export function setLinkInteraction(state: boolean) {
    linkInteraction = state;
    linkLayers.setInteractive(state)
}


function onUnitUpdate() {
    structureEvents.dispatchEvent(new Event('updateunit'))
}
export function addUnit(unitLayer: UnitLayer) {
    unitLayers.addLayer(unitLayer)
    unitLayer.on('update', onUnitUpdate)
    structureEvents.dispatchEvent(new Event('addunit'))
}
export function removeUnit(unitLayer: UnitLayer) {
    unitLayer.off('update', onUnitUpdate)
    unitLayers.removeLayer(unitLayer)
    structureEvents.dispatchEvent(new Event('removeunit'))
}


export function addLink(linkLayer: LinkLayer) {
    linkLayers.addLayer(linkLayer)
}
export function removeLink(linkLayer: LinkLayer) {
    linkLayers.removeLayer(linkLayer)
}


export function getSelectedUnits() {
    const elements = document.querySelectorAll('.unit-selected')
    const units = new Array<Unit>
    for (const element of elements) {
        units.push(getUnitById(element.id))
    }
    return units
}

export function getSelectedUnitLayers() {
    const elements = document.querySelectorAll('.unit-selected')
    const units = new Array<UnitLayer>
    for (const element of elements) {
        units.push(getUnitLayerById(element.id))
    }
    return units
}


export function toggleSelectAllUnitLayers() {
    const unitLayers = getUnitLayers()
    let allSelected = true
    for (const unitLayer of unitLayers) if (!unitLayer.isSelected()) {
        allSelected = false
        break
    }
    if (allSelected) deselectAllUnitLayers()
    else selectAllUnitLayers()
}

export function selectAllUnitLayers() {
    for (const unitLayer of getUnitLayers()) unitLayer.select()
}

export function deselectAllUnitLayers() {
    for (const unitLayer of getUnitLayers()) unitLayer.deselect()
}