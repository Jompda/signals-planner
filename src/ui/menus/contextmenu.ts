import { Map as LMap, LeafletMouseEvent } from 'leaflet'
import { ContextMenuItem } from '../../interfaces'
import { deserialize, serialize } from '../../struct'
import { requestFileUpload, startDownload } from '../../util'
import { showAddUnitMenu } from './unitmenus'
import { openTopographyPopup } from '../../topoutil'
import { addAction, redo, undo } from '../../actionhistory'
import ImportAction from '../../actions/importaction'
import RemoveAllAction from '../../actions/removeallaction'
import { geoJsonToLayers, layersToGeoJson } from '../../drawsetup'


export function initContextMenu(map: LMap) {
    const mapOnlyItems: Array<ContextMenuItem> = [{
        text: 'Undo',
        index: 1,
        callback: undo
    }, {
        text: 'Redo',
        index: 2,
        callback: redo
    }, {
        separator: true,
        index: 3
    }, {
        text: 'Add Unit',
        index: 4,
        callback: (e) => showAddUnitMenu(map, e)
    }, {
        separator: true,
        index: 5
    }, {
        text: 'Export',
        index: 6,
        callback: () => {
            const structure = serialize()
            const str = JSON.stringify({
                ...structure,
                center: map.getCenter(),
                zoom: map.getZoom(),
                drawings: layersToGeoJson()
            }, undefined, 2)
            startDownload(new Date().toISOString() + '.json', 'application/json', str)
        }
    }, {
        text: 'Import',
        index: 7,
        callback: () => requestFileUpload('application/json', (content) => {
            const parsed = JSON.parse(content)
            const { units, links, center, zoom, drawings } = deserialize(parsed)
            addAction(new ImportAction(units, links, geoJsonToLayers(drawings)).forward())
            map.setView([center.lat, center.lng], zoom)
        })
    }, {
        text: 'Remove All',
        index: 8,
        callback: () => addAction(new RemoveAllAction().forward())
    }, {
        separator: true,
        index: 9
    }]
    const baseContextMenuItems: Array<ContextMenuItem> = [{
        text: 'Topography',
        index: 10,
        callback: (e) => openTopographyPopup(map, e.latlng)
    }, {
        text: 'Center map here',
        index: 11,
        callback: (e: LeafletMouseEvent) => map.panTo(e.latlng)
    }]
    setContextmenuItems(map, baseContextMenuItems)

    map.on('contextmenu', (e) => {
        if ((e.originalEvent.target as HTMLElement).id === 'map')
            setContextmenuItems(map, (mapOnlyItems).concat(...baseContextMenuItems))
    })
    map.on('contextmenu.hide', () => setContextmenuItems(map, baseContextMenuItems))
}

export function setContextmenuItems(map: LMap, items: Array<ContextMenuItem>) {
    (map as any).options.contextmenuItems = items;
    (map as any).contextmenu.removeAllItems();
    (map as any).contextmenu._createItems();
}