//import 'leaflet/dist/leaflet.css'
import './styles.css'
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css'
import 'leaflet-dialog/Leaflet.Dialog.css'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import 'react-tabs/style/react-tabs.css'

import { Map as LMap, MapOptions, control, LeafletKeyboardEvent, LatLng as LLatLng } from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import 'leaflet-contextmenu'
import 'leaflet-dialog'

import options from '../options'


/*
 * Setup leaflet-topography
 */
import 'regenerator-runtime'
import { configure } from 'leaflet-topography'
const topoLayerTileCache = new Map<string, any>()
configure({
    token: options.mapboxToken,
    priority: 'speed',
    saveTile: (name: string, data: any) => topoLayerTileCache.set(name, data),
    retrieveTile: (name: string) => topoLayerTileCache.get(name),
    scale: 14
})


/*
 * Setup tiledata
 */
import { setConfig as setTiledataConfig } from 'tiledata'
export type SourceName = 'elevation' | 'treeHeight'
export interface TiledataLatLng extends Record<SourceName, number> {
    tileName: string
    latlng: LLatLng
}
const tileDataStorage = new Map<string, Record<SourceName, Int16Array>>()

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
            url: `https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/{z}/{x}/{y}.pngraw?access_token=${options.mapboxToken}`,
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
import { addTo as lgAddTo, getMap } from './ui/structurecontroller'
import { baseLayers, overlays } from './ui/tilelayers'
import defaultTool from './ui/tools/defaultool'
import addNodeTool from './ui/tools/addnodetool'
import linkEditorTool from './ui/tools/linkeditortool'
import { redo, undo } from './actionhistory'
import { createCustomToolbar } from './ui/menus/toolbar'
import unitlinkicon from './assets/unitlink.png'


const map = new LMap('map', {
    contextmenu: true,
    contextmenuWidth: 140,
    wheelPxPerZoomLevel: 60 / 0.5,
    doubleClickZoom: false,
    boxZoom: false
} as MapOptions).setView([60, 24], 4)

initContextMenu(map)
lgAddTo(map)
control.scale({ imperial: false }).addTo(map);

baseLayers.OSM.addTo(map);


(control as any).optionsMenu({ position: 'topright' }).addTo(map);
(control as any).layerControl({ ...baseLayers, ...overlays }, { position: 'topright' }).addTo(map)
createCustomToolbar([
    defaultTool,
    {
        tooltip: 'Link Tools',
        icon: <img src={unitlinkicon} />,
        radio: false,
        items: [
            linkEditorTool,
            {
                tooltip: 'Link Graphs',
                icon: <i className='fa fa-diagram-project' />,
                radio: false,
                addHooks: () => showLinkGraphToolMenu(getMap())
            }
        ]
    },
    addNodeTool
], { position: 'topleft' }).addTo(map)


map.on('keydown', (e: LeafletKeyboardEvent) => {
    const event = e.originalEvent
    if (
        event.ctrlKey && !event.shiftKey && !event.altKey
        && event.key.toUpperCase() == 'Z'
    ) undo()
    if (
        event.ctrlKey && !event.shiftKey && !event.altKey
        && event.key.toUpperCase() == 'Y'
    ) redo()
})


import { initGeoman } from './ui/geomancontroller'
import { initMapHooks } from './ui/toolcontroller'
import { showLinkGraphToolMenu } from './ui/menus/linkgraphmenus'
initGeoman(map)
initMapHooks(map)