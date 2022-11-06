import * as L from 'leaflet'
import customElevationLayer from './customelevationlayer'


export const tileLayers = {
    'OSM': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    'Topography:Elevation': customElevationLayer
}
