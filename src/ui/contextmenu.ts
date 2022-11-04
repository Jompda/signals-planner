import * as L from 'leaflet'

import { ContextMenuItem } from '../interfaces'
import { addLink as structAddLink, getUnitById } from '../struct'
import Link from '../struct/link'
import { showAddUnitMenu } from './unitmenus'
import { addLink as lgAddLink } from './layercontroller'


export function initContextMenu(map: L.Map) {
    const mapOnlyItems: Array<ContextMenuItem> = [{
        text: 'Add Unit',
        index: 3,
        callback: (e) => showAddUnitMenu(map, e)
    }, {
        text: 'Add Link',
        index: 4,
        callback: () => {
            const link = new Link({
                id: '1-2',
                unit0: getUnitById('1'),
                unit1: getUnitById('2')
            })
            structAddLink(link)
            lgAddLink(link)
        }
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