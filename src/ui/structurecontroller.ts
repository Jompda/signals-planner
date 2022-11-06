import * as L from 'leaflet'
import Unit from '../struct/unit'
import Link from '../struct/link'
import { getLinks, getUnits, removeLink as structRemoveLink } from '../struct'


const unitLg = new L.LayerGroup<L.Marker>()
const linkLg = new L.LayerGroup<L.Polyline>()


let _map: L.Map
export function addTo(map: L.Map) {
    _map = map
    map.addLayer(linkLg)
    map.addLayer(unitLg)
}
export function remove() {
    unitLg.remove()
    linkLg.remove()
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
    for (const unit of getUnits()) {
        (unit.layer as any).setInteractive(state)
    }
}


let linkInteraction = true
export function isLinkInteractionEnabled() {
    return linkInteraction
}
export function setLinkInteraction(state: boolean) {
    linkInteraction = state
    for (const link of getLinks()) {
        (link.layer as any).setInteractive(state)
    }
}


export function addUnit(unit: Unit) {
    unitLg.addLayer(unit.layer)
}
export function removeUnit(unit: Unit) {
    unit.layer.remove()
}
/*export function setUnitDragging(state: boolean) {
    if (state) for (const unit of units) unit.layer.dragging.enable()
    else for (const unit of units) unit.layer.dragging.disable()
}*/


export function addLink(link: Link) {
    function update() {
        link.update()
    }

    function rm() {
        link.unit0.layer.off('dragend', update)
        link.unit1.layer.off('dragend', update)
        link.unit0.layer.off('update', update)
        link.unit1.layer.off('update', update)
        link.unit0.layer.off('remove', rm)
        link.unit1.layer.off('remove', rm)
        link.layer.off('remove', rm)

        removeLink(link)
        structRemoveLink(link)
    }

    link.unit0.layer.on('dragend', update)
    link.unit1.layer.on('dragend', update)
    link.unit0.layer.on('update', update)
    link.unit1.layer.on('update', update)
    link.unit0.layer.on('remove', rm)
    link.unit1.layer.on('remove', rm)
    link.layer.on('remove', rm)

    update()
    linkLg.addLayer(link.layer)
}
export function removeLink(link: Link) {
    link.layer.remove()
    // remove all handlers
}

