import * as L from 'leaflet'

import { ContextMenuItem } from '../interfaces'
import { showAddNodeMenu } from './addnode'


export function initContextMenu(map: L.Map) {
    const mapOnlyItems: Array<ContextMenuItem> = [{
        text: 'Add node',
        index: 4,
        callback: (e) => showAddNodeMenu(map, e)
    }, {
        separator: true,
        index: 9
    }]
    const baseContextMenuItems: Array<ContextMenuItem> = [{
        text: 'Center map here',
        index: 10,
        callback: (e: L.LeafletMouseEvent) => map.panTo(e.latlng)
    }]
    setContextmenuItems(map, baseContextMenuItems)

    map.on('contextmenu', (e) => {
        if ((e.originalEvent.target as HTMLElement).id === 'map')
            setContextmenuItems(map, (mapOnlyItems as any).concat(baseContextMenuItems))
    })
    map.on('contextmenu.hide', () => setContextmenuItems(map, baseContextMenuItems))
}

export function setContextmenuItems(map: L.Map, items: Array<ContextMenuItem>) {
    (map as any).options.contextmenuItems = items;
    (map as any).contextmenu.removeAllItems();
    (map as any).contextmenu._createItems();
}