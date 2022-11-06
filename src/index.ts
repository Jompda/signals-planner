//import 'leaflet/dist/leaflet.css'
import './styles.css'
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css'
import 'leaflet-dialog/Leaflet.Dialog.css'

import * as L from 'leaflet'
import 'leaflet-contextmenu'
import 'leaflet-dialog'


import 'regenerator-runtime'
import { configure } from 'leaflet-topography'
const topoLayerTileCache = new Map<string, any>()
configure({
    token: options.mapboxToken,
    priority: 'storage',
    saveTile: (name: string, data: any) => topoLayerTileCache.set(name, data),
    retrieveTile: (name: string) => topoLayerTileCache.get(name)
})


import options from '../options'
import './ui/menus/layercontrolmenu'
/*import { forward } from 'mgrs'
import * as tiledata from 'tiledata'
import * as ms from 'milsymbol'*/

import { initContextMenu } from './ui/menus/contextmenu'
import { addTo as lgAddTo } from './ui/structurecontroller'
import { tileLayers } from './ui/tilelayers'


const map = L.map('map', {
    contextmenu: true,
    contextmenuWidth: 140,
    wheelPxPerZoomLevel: 60 / 0.5,
    doubleClickZoom: false
} as L.MapOptions).setView([60, 24], 4)

initContextMenu(map)
lgAddTo(map)
L.control.scale({ imperial: false }).addTo(map);




(L as any).layerControl(tileLayers, { position: 'topright' }).addTo(map)


/*const tileDataStorage = new Map()
tiledata.setConfig({
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
                // Colors retrieved from: https://kartta.luke.fi/geoserver/MVMI/ows?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&width=20&height=20&layer=keskipituus_1519
                // Due to value incrementation and the last increment being 220dm - infinity, let's just use Finland's tallest tree as the max value :D
                const values = new Map([
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
                    ['40,31,149', 47]
                ])
                return Math.ceil(values.get([r, g, b].join(',')))
            }
        }
    ],
    saveDataByTile: (name: string, data: any) => {
        tileDataStorage.set(name, data)
    },
    getDataByTile: (name: string) => tileDataStorage.get(name)
})

console.log('requesting')
tiledata.getTiledata({
    x: 0,
    y: 0,
    z: 1
}, ['elevation']).then(result => console.log('resolved', result))

console.log(forward([24, 64]))*/