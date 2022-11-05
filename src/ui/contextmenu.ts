import * as L from 'leaflet'

import { ContextMenuItem } from '../interfaces'
import { deserialize, serialize } from '../struct'
import { startDownload } from '../util'
import { showAddUnitMenu } from './unitmenus'
import { addUnit as lgAddUnit, addLink as lgAddLink } from './layercontroller'


export function initContextMenu(map: L.Map) {
    const mapOnlyItems: Array<ContextMenuItem> = [{
        text: 'Add Unit',
        index: 3,
        callback: (e) => showAddUnitMenu(map, e)
    }, {
        separator: true,
        index: 6
    }, {
        text: 'Export',
        index: 7,
        callback: () => {
            const str = JSON.stringify(serialize(), undefined, 2)
            startDownload(new Date().toISOString() + '.json', 'application/json', str)
        }
    }, {
        text: 'Import',
        index: 8,
        callback: () => { // Create valid menus
            const fileInput = document.createElement('input')
            fileInput.setAttribute('type', 'file')
            fileInput.setAttribute('multiple', '')

            fileInput.onchange = () => {
                const file = fileInput.files[0]
                if (!file) return alert('Select a file to load!')
                console.log(`Reading "${file.name}" ..`)
                const reader = new FileReader()
                reader.onload = function (e) {
                    //console.log(e.target.result)
                    postLoad(JSON.parse(e.target.result.toString()))
                }
                reader.readAsText(file)
            }

            fileInput.click()

            function postLoad(parsed: any) {
                const { units, links } = deserialize(parsed)
                for (const unit of units) lgAddUnit(unit)
                for (const link of links) lgAddLink(link)
            }
        }
    }, {
        text: '(Remove All)',
        index: 9
    }, {
        separator: true,
        index: 10
    }]
    const baseContextMenuItems: Array<ContextMenuItem> = [{
        text: 'Center map here',
        index: 11,
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