import { Map as LMap, LeafletMouseEvent } from 'leaflet'
import { ContextMenuItem } from '../../interfaces'
import { deserialize, serialize } from '../../struct'
import { geoJsonToLayers, layersToGeoJson, requestFileUpload, startDownload } from '../../util'
import { showAddUnitMenu } from './unitmenus'
import { openInfoPopup } from '../../topoutil'
import { addAction, redo, undo } from '../../actionhistory'
import ImportAction from '../../actions/importaction'
import RemoveAllAction from '../../actions/removeallaction'
import { getDrawnLayers, getDrawStyleOptions } from '../geomancontroller'
import { deselectAllUnitLayers, selectAllUnitLayers, toggleSelectAllUnitLayers } from '../structurecontroller'

let i = 0;

export function initContextMenu(map: LMap) {
    const mapOnlyItems: Array<ContextMenuItem> = [{
        text: 'Undo',
        index: ++i,
        callback: undo
    }, {
        text: 'Redo',
        index: ++i,
        callback: redo
    }, {
        separator: true,
        index: ++i
    }, {
        text: 'Add Unit',
        index: ++i,
        callback: (e) => showAddUnitMenu(map, e)
    }, {
        text: 'Select All Units',
        index: ++i,
        callback: selectAllUnitLayers
    }, {
        text: 'Deselect All Units',
        index: ++i,
        callback: deselectAllUnitLayers
    }, {
        separator: true,
        index: ++i
    }, {
        text: 'Export',
        index: ++i,
        callback: () => {
            const structure = serialize(false)
            const str = JSON.stringify({
                ...structure,
                center: map.getCenter(),
                zoom: map.getZoom(),
                drawings: layersToGeoJson(getDrawnLayers().getLayers())
            }, undefined, 2)
            startDownload(new Date().toISOString() + '.json', 'application/json', str)
        }
    }, {
        text: 'Import',
        index: ++i,
        callback: () => requestFileUpload('application/json', (content) => {
            const parsed = JSON.parse(content)
            const { units, links, center, zoom, drawings } = deserialize(parsed)
            addAction(new ImportAction(units, links, geoJsonToLayers(drawings, getDrawStyleOptions())).forward())
            map.setView([center.lat, center.lng], zoom)
        })
    }, {
        text: 'Remove All',
        index: ++i,
        callback: () => addAction(new RemoveAllAction().forward())
    }, {
        separator: true,
        index: ++i
    }]
    const baseContextMenuItems: Array<ContextMenuItem> = [{
        text: 'Topography',
        index: ++i,
        callback: (e) => openInfoPopup(map, e.latlng)
    }, {
        text: 'Center map here',
        index: ++i,
        callback: (e: LeafletMouseEvent) => map.panTo(e.latlng)
    }]
    setContextmenuItems(map, baseContextMenuItems)

    map.on('contextmenu', (e) => {
        if ((e.originalEvent.target as HTMLElement).id === 'map')
            setContextmenuItems(map, (mapOnlyItems).concat(...baseContextMenuItems))
    })
    map.on('contextmenu.hide', () => setContextmenuItems(map, baseContextMenuItems))
}

export function setContextmenuItems(lmap: LMap, items: Array<ContextMenuItem>) {
    const map = lmap as any
    map.options.contextmenuItems = items;
    map.contextmenu.removeAllItems();
    map.contextmenu._createItems();
}