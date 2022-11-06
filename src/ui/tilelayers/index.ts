import * as L from 'leaflet'
import { createMapboxTerrainAttribution } from '../../util'
import options from '../../../options'
import customElevationLayer from './customelevationlayer'


const tileLayers = {
    'OSM': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        //bounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
        //noWrap: true
    }),
    'Mapbox:Terrain-DEM-v1': L.tileLayer(`https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/{z}/{x}/{y}.pngraw?access_token=${options.mapboxToken}`, {
        attribution: createMapboxTerrainAttribution(),
        //bounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
        //noWrap: true
    } as L.TileLayerOptions),
    'Topography:Elevation': customElevationLayer
}


export {
    tileLayers
}