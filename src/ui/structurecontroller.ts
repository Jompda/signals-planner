import { Map as LMap, LayerGroup } from 'leaflet'
import { getLinksByUnitId, removeLink as structRemoveLink } from '../struct'
import UnitLayer from './components/unitlayer'
import LinkLayer from './components/linklayer'


const unitLayers = new LayerGroup<UnitLayer>()
const linkLayers = new LayerGroup<LinkLayer>()


export function getUnitById(unitId: string) {
    return (unitLayers.getLayers() as Array<UnitLayer>).find(u => u.unit.id == unitId)
}
export function getLinkById(linkId: string) {
    return (linkLayers.getLayers() as Array<LinkLayer>).find(l => l.link.id == linkId)
}

export function getLinkLayersByUnitId(unitId: string) {
    const linkLayers = new Array<LinkLayer>()
    for (const link of getLinksByUnitId(unitId))
        linkLayers.push(getLinkById(link.id))
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
    unitInteraction = state
    for (const unitLayer of unitLayers.getLayers()) {
        (unitLayer as any).setInteractive(state)
    }
}


let linkInteraction = true
export function isLinkInteractionEnabled() {
    return linkInteraction
}
export function setLinkInteraction(state: boolean) {
    linkInteraction = state
    for (const linkLayer of linkLayers.getLayers()) {
        (linkLayer as any).setInteractive(state)
    }
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
/*export function setUnitDragging(state: boolean) {
    if (state) for (const unit of units) unit.layer.dragging.enable()
    else for (const unit of units) unit.layer.dragging.disable()
}*/


export function addLink(linkLayer: LinkLayer) {
    linkLayers.addLayer(linkLayer)
}
export function removeLink(linkLayer: LinkLayer) {
    linkLayer.remove()
}

