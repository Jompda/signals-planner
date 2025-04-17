//import 'leaflet/dist/leaflet.css'
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css'
import 'leaflet-dialog/Leaflet.Dialog.css'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import 'react-tabs/style/react-tabs.css'
import 'leaflet-ruler/src/leaflet-ruler.css'
import 'leaflet-notifications/css/leaflet-notifications.css'
import './styles.css'

import { Map as LMap, control, LeafletKeyboardEvent } from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import 'leaflet-contextmenu'
import 'leaflet-dialog'

import { getSetting } from './settings'


/*
 * Setup leaflet-topography
 */
import 'regenerator-runtime'
import { configure } from 'leaflet-topography'
const topoLayerTileCache = new Map<string, any>()
configure({
    token: getSetting('mapboxToken') as string,
    priority: 'speed',
    saveTile: (name: string, data: any) => topoLayerTileCache.set(name, data),
    retrieveTile: (name: string) => topoLayerTileCache.get(name),
    scale: 14
})


/*
 * Setup tiledata
 */
import { setConfig as setTiledataConfig } from 'tiledata'
import { SourceName } from './interfaces'
const tileDataStorage = new Map<string, Record<SourceName, Int16Array>>()
export { tileDataStorage };

// Colors retrieved from: https://kartta.luke.fi/geoserver/MVMI/ows?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&width=20&height=20&layer=keskipituus_1519
// Due to value incrementation and the last increment being 220dm - infinity, let's just use value 30 as a compromise even though Finland's tallest tree is 47m.
const treeHeightsByColors = new Map([
    ['255,255,255', 0],
    ['151,71,73', 0],
    ['254,114,0', 1.3],
    ['254,152,70', 5.7],
    ['254,205,165', 8.5],
    ['195,255,195', 10.7],
    ['131,243,115', 12.5],
    ['24,231,22', 14.3],
    ['2,205,0', 16.1],
    ['1,130,0', 18.4],
    ['23,0,220', 21.9],
    ['40,31,149', 30]
])
setTiledataConfig<SourceName>({
    sources: [
        {
            name: 'elevation',
            type: 'wmts',
            // Source: https://docs.mapbox.com/data/tilesets/reference/mapbox-terrain-dem-v1/
            url: `https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/{z}/{x}/{y}.pngraw?access_token=${getSetting('mapboxToken')}`,
            valueFunction: function (R: number, G: number, B: number) {
                return -10000 + (R * 256 * 256 + G * 256 + B) * 0.1;
            }
        },
        {
            name: 'treeHeight',
            type: 'wms',
            // Attribution: © Luonnonvarakeskus, 2019, keskipituus_1519, Monilähteisen valtakunnan metsien inventoinnin (MVMI) kartta-aineisto 2017
            url: 'https://kartta.luke.fi/geoserver/MVMI/ows?',
            layers: 'keskipituus_1519',
            valueFunction: function (r: number, g: number, b: number) {
                return Math.ceil(treeHeightsByColors.get([r, g, b].join(',')))
            }
        }
    ],
    saveDataByTile: (name: string, data: Record<SourceName, Int16Array>) => {
        tileDataStorage.set(name, data)
    },
    getDataByTile: (name: string) => tileDataStorage.get(name)
})


/*
 * Setup the UI
 */
import './ui/menus/optionsmenu'
import './ui/menus/layercontrolmenu'
import './ui/menus/toolbar'
import { initContextMenu } from './ui/menus/contextmenu'
import { addTo as lgAddTo, getMap, toggleSelectAllUnitLayers } from './ui/structurecontroller'
import { baseLayers, overlays } from './ui/tilelayers'
import defaultTool from './ui/tools/defaultool'
import addUnitTool from './ui/tools/addunittool'
import linkEditorTool from './ui/tools/linkeditortool'
import { addAction, redo, undo } from './actionhistory'
import './ui/menus/toolbar'
import unitlinkicon from './assets/unitlink.png'
import { showLinkGraphToolMenu } from './ui/menus/linkgraphmenus'


const map = new LMap('map', {
    contextmenu: true,
    contextmenuWidth: 160,
    wheelPxPerZoomLevel: 60 / 0.5,
    doubleClickZoom: false,
    boxZoom: false,
    attributionControl: false
}).setView([60, 24], 4)
control.attribution({
    position: 'topright'
}).addTo(map)

initContextMenu(map)
lgAddTo(map)

control.scale({ imperial: false }).addTo(map)
import './ui/zoomratio'
control.zoomRatio().addTo(map)
baseLayers.OSM.addTo(map)


/*
 * Init toolbar, geomand other tools.
 * // NOTE: Possibility to include some menus such as settings with this.
 * https://github.com/turbo87/sidebar-v2/
 */
// TODO: these OptionsItems should be constructed by their respective modules
control.optionsMenu({ position: 'topright' }).addTo(map)
control.layerControl({ ...baseLayers, ...overlays }, { position: 'topright' }).addTo(map)
control.customToolbar([
    defaultTool,
    {
        name: 'linktools',
        tooltip: 'Link Tools',
        icon: <img src={unitlinkicon} />,
        radio: false,
        items: [
            linkEditorTool,
            {
                name: 'linkgraphs',
                tooltip: 'Link Graphs',
                icon: <i className='fa fa-diagram-project' />,
                radio: false,
                addHooks: () => showLinkGraphToolMenu(getMap())
            }
        ]
    },
    addUnitTool
], { position: 'topleft' }).addTo(map)
// bruh
defaultTool.addHooks(map)
setTimeout(() => document.getElementById('ctoolbar-default').setAttribute('checked', ''))


import { initGeoman } from './ui/geomancontroller'
import { initMapHooks } from './ui/toolcontroller'
import 'leaflet-ruler/src/leaflet-ruler'
import { deserialize, serialize } from './struct'
import ImportAction from './actions/importaction'
initGeoman(map)
initMapHooks(map)
control.ruler({ // NOTE: For some reason, you have to double click the map after enabling this tool to be able to disable it.
    position: 'topleft',
    circleMarker: {
        color: 'red',
        radius: 2
    },
    lineStyle: {
        color: 'red',
        dashArray: '1,6'
    },
    lengthUnit: {
        display: 'km',
        decimal: 2,
        factor: null,
        label: 'Distance:'
    },
    angleUnit: {
        display: '&deg;',
        decimal: 2,
        factor: null,
        label: 'Bearing:'
    }
}).addTo(map)


import 'leaflet-notifications'
// Usage: https://gitlab.com/manuel.richter95/leaflet.notifications
export const notifications = control.notifications({
    timeout: 3000,
    position: 'bottomright',
    closable: false,
    // NOTE: Dismissable needs to be set to false on notifications
    // which include links to more information
    dismissable: true, 
    className: 'default'
}).addTo(map)


/*
 * Keyboard events
 */
map.on('keydown', async (e: LeafletKeyboardEvent) => {
    const ev = e.originalEvent
    if (
        ev.ctrlKey && !ev.shiftKey && !ev.altKey
        && ev.key.toUpperCase() == 'Z'
    ) undo()

    else if (
        ev.ctrlKey && !ev.shiftKey && !ev.altKey
        && ev.key.toUpperCase() == 'Y'
    ) redo()

    else if (
        ev.ctrlKey && !ev.shiftKey && !ev.altKey
        && ev.key.toLocaleUpperCase() == 'A'
    ) {
        ev.preventDefault()
        toggleSelectAllUnitLayers()
    }

    else if (
        ev.ctrlKey && !ev.shiftKey && !ev.altKey
        && ev.key.toUpperCase() == 'C'
    ) {
        const result = JSON.stringify(serialize(true), undefined, 2)
        navigator.clipboard.writeText(result)
        notifications.info('Copied selection to clipboard')
    }

    else if (
        ev.ctrlKey && !ev.shiftKey && !ev.altKey
        && ev.key.toUpperCase() == 'V'
    ) {
        let text: string = undefined
        try {
            text = await navigator.clipboard.readText()
        } catch (er) {
            return notifications.alert(`Couldn't read the clipboard`)
        }
        const parsed = JSON.parse(text)
        const { units, links } = deserialize(parsed)
        if (units.length === 0) return notifications.warning('No units were found on the clipboard')
        addAction(new ImportAction(units, links).forward())
        notifications.info('Pasted from clipboard')
    }
})