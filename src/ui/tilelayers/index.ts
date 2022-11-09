import { tileLayer } from 'leaflet'
import WMS from 'leaflet.wms'
import customElevationLayer from './customelevationlayer'


export const tileLayers = {
    'OSM': tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    'Topography: Elevation': customElevationLayer,
    'Luke: Avg. tree height': WMS.overlay('https://kartta.luke.fi/geoserver/MVMI/ows', {
        attribution: '<a href="https://www.luke.fi/">Natural Resources Institute Finland</a> under <a href="https://creativecommons.org/licenses/by/4.0/legalcode">CC-4.0</a>',
        layers: 'keskipituus_1519',
        transparent: true
    })
}
