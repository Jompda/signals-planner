import { Circle, FeatureGroup, geoJSON, Layer, Map as LMap, Marker, PathOptions, Polygon, Polyline } from 'leaflet'
import { addAction } from './actionhistory'
import { AddDrawLayerAction, EditDrawLayersAction, RemoveDrawLayerAction } from './actions/drawactions'
import { setLinkInteraction, setUnitInteraction } from './ui/structurecontroller'


const styleOptions: PathOptions = {
    color: 'black',
    opacity: 0.8,
    interactive: false,
    fillColor: 'black',
    fillOpacity: 0.1,
}


const drawnLayers = new FeatureGroup()
let editAction: EditDrawLayersAction
drawnLayers.on('pm:dragstart', () =>
    editAction = new EditDrawLayersAction(drawnLayers).saveOld()
)
drawnLayers.on('pm:rotatestart', () =>
    editAction = new EditDrawLayersAction(drawnLayers).saveOld()
)
drawnLayers.on('pm:dragend', () =>
    addAction(editAction.saveNew())
)
drawnLayers.on('pm:rotateend', () =>
    addAction(editAction.saveNew())
)
drawnLayers.on('pm:textchange', (e) => {
    if ((e.layer as any).skipTextChange)
        return (e.layer as any).skipTextChange = false
    if (editAction) addAction(editAction.saveNew())
})

export function getDrawnLayers() {
    return drawnLayers
}
export function layersToGeoJson() {
    return (drawnLayers.getLayers() as Array<Polyline | Polygon | Circle | Marker>).map(layer => {
        const json = layer.toGeoJSON()
        if (layer instanceof Circle)
            json.properties.radius = layer.getRadius()
        else if ((layer.options as any).textMarker)
            json.properties.text = (layer.options as any).text
        return json
    })
}
export function geoJsonToLayers(geojson: Array<any>) {
    const layers = new Array<Layer>()
    geoJSON(geojson, {
        style: styleOptions,
        pointToLayer: (feature, latlng) => {
            if (feature.properties.radius)
                return new Circle(latlng, feature.properties.radius)
            else if (feature.properties.text)
                return new Marker(latlng, {
                    textMarker: true,
                    text: feature.properties.text
                })
            return new Marker(latlng)
        },
        onEachFeature: (feature, layer) => layers.push(layer)
    })
    return layers
}


export function initGeoman(map: LMap) {
    drawnLayers.addTo(map)
    map.pm.setGlobalOptions({
        layerGroup: drawnLayers,
        pathOptions: styleOptions,
        hintlineStyle: styleOptions,
        templineStyle: styleOptions
    })
    map.pm.addControls({
        position: 'topleft',
        drawMarker: false,
        drawCircleMarker: false,
        cutPolygon: false // NOTE: Cut disabled until cut action is implemented.
    })


    map.on('pm:drawstart', disableStructureControls)
    map.on('pm:drawend', enableStructureControls)
    function enableStructureControls() {
        setUnitInteraction(true)
        setLinkInteraction(true)
    }
    function disableStructureControls() {
        setUnitInteraction(false)
        setLinkInteraction(false)
    }


    map.on('pm:create', (e) =>
        addAction(new AddDrawLayerAction(drawnLayers, e.layer))
    )
    map.on('pm:remove', (e) =>
        addAction(new RemoveDrawLayerAction(drawnLayers, e.layer))
    )
    map.on('pm:globaleditmodetoggled', () =>
        map.pm.globalEditModeEnabled()
            ? editAction = new EditDrawLayersAction(drawnLayers).saveOld()
            : addAction(editAction.saveNew())
    )
    // TODO: Support for cut
    /*map.on('pm:globalcutmodetoggled', () =>
        map.pm.globalCutModeEnabled()
            ? editAction = new EditDrawLayersAction(drawnLayers).saveOld()
            : addAction(editAction.saveNew())
    )*/

    map.on('pm:globaldragmodetoggled', () =>
        (drawnLayers as any).setInteractive(map.pm.globalDragModeEnabled())
    )
    map.on('pm:globalremovalmodetoggled', () =>
        (drawnLayers as any).setInteractive(map.pm.globalRemovalModeEnabled())
    )
    map.on('pm:globalcutmodetoggled', () =>
        (drawnLayers as any).setInteractive(map.pm.globalCutModeEnabled())
    )
}