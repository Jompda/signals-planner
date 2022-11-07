import { tileLayer } from 'leaflet'
import customElevationLayer from './customelevationlayer'


export const tileLayers = {
    'OSM': tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    'Topography:Elevation': customElevationLayer
}
