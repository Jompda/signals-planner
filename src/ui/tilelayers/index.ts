import { GridLayer, tileLayer } from 'leaflet'
import WMS from 'leaflet.wms'
import customElevationLayer from './customelevationlayer'
import './basicauthlayer'
import './emissionlayer'
import { TopoLayer } from 'leaflet-topography'
import { createMapboxTerrainAttribution } from '../../util'
import { getSetting } from '../../settings'


export const baseLayers = {
    'OSM': tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    'OTM': tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }),
    'Esri: WTM': tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    }),
    'Esri: Satellite': tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    // capabilities: https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/WMTSCapabilities.xml
    'MML: Maastokartta': new (GridLayer as any).basicAuthLayer(`https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/maastokartta/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.png`, {
        attribution: '<a href="https://www.maanmittauslaitos.fi/">MML</a>: Maastokartta under <a href="https://creativecommons.org/licenses/by/4.0/legalcode">CC-4.0</a>',
        username: getSetting('MMLApiKey'),
        lcOptions: '<a href="https://www.maanmittauslaitos.fi/sites/maanmittauslaitos.fi/files/old/karttamerkkien_selitys_kkp_0.pdf" target="_blank">MML Symbol explanations</a>'
    } as any)
}


export const overlays = {
    'OpenRailwayMap': tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }),
    'Topography: Elevation': customElevationLayer,
    'Topography: Slope': new TopoLayer({
        attribution: 'Topography by Seth "slutske22" Lutske, ' + createMapboxTerrainAttribution(),
        topotype: 'slope',
        customization: {
            colors: ['#000000', '#00ff00', '#0000ff', '#ff0000'],
            breakpoints: [0, 20, 60, 90], // There's sum f*ckeroonies going on.
            continuous: true,
            fallback: '#00ff00'
        }
    }),
    'Topography: Aspect': new TopoLayer({
        attribution: 'Topography by Seth "slutske22" Lutske, ' + createMapboxTerrainAttribution(),
        topotype: 'aspect'
    }),
    'Topography: Slope Aspect': new TopoLayer({
        attribution: 'Topography by Seth "slutske22" Lutske, ' + createMapboxTerrainAttribution(),
        topotype: 'slopeaspect'
    }),
    'Luke: Avg. tree height': WMS.tileLayer('https://kartta.luke.fi/geoserver/MVMI/ows', {
        attribution: '<a href="https://www.luke.fi/en">Natural Resources Institute Finland</a> under <a href="https://creativecommons.org/licenses/by/4.0/legalcode">CC-4.0</a>',
        tileSize: 256,
        layers: 'keskipituus_1519',
        transparent: true,
        format: 'image/png',
        lcOptions: '<img style="padding:0.5em" src="https://kartta.luke.fi/geoserver/MVMI/ows?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&layer=keskipituus_1519" />'
    }),
    'Emission Layer': new (GridLayer as any).emissionLayer()
}
