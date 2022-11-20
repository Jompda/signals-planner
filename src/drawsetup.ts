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
drawnLayers.on('pm:enable', () =>
    editAction = new EditDrawLayersAction(drawnLayers).saveOld()
)
drawnLayers.on('pm:edit', () =>
    addAction(editAction.saveNew())
)

export function getDrawnLayers() {
    return drawnLayers
}
export function layersToGeoJson() {
    return (drawnLayers.getLayers() as Array<Polyline | Polygon | Circle>).map(layer => {
        const json = layer.toGeoJSON()
        if (layer instanceof Circle)
            json.properties.radius = layer.getRadius()
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
        drawCircleMarker: false
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
}




/*
// TODO: Create the control toolbar with leaflet.toolbar (Toolbar2) from scratch for better compatability.
export function initDraw(map: LMap) {
    // TODO: Ability to save and load leaflet-draw:ings
    drawnLayers.addTo(map)

    const drawOptions: DrawOptions.PolygonOptions = {
        shapeOptions: {
            color: 'black',
            opacity: 0.8,
            interactive: false,
            fill: true,
            fillColor: 'black',
            fillOpacity: 0.1
        },
    }

    const options = {
        edit: {
            featureGroup: drawnLayers,
            remove: true
        },
        draw: {
            polyline: {
                metric: true,
                shapeOptions: {
                    interactive: false,
                    color: 'black',
                    opacity: 0.8
                }
            },
            polygon: drawOptions,
            rectangle: drawOptions,
            circle: drawOptions,
            circlemarker: false,
            marker: false
        }
    }
    const drawControl = new Control.Draw(options as any).addTo(map)

    map.on(Draw.Event.DRAWSTART, disableStructureControls)
    map.on(Draw.Event.EDITSTART, disableStructureControls)
    map.on(Draw.Event.DELETESTART, disableStructureControls)
    map.on(Draw.Event.DRAWSTOP, enableStructureControls)
    map.on(Draw.Event.EDITSTOP, enableStructureControls)
    map.on(Draw.Event.DELETESTOP, enableStructureControls)
    function enableStructureControls() {
        setUnitInteraction(true)
        setLinkInteraction(true)
    }
    function disableStructureControls() {
        setUnitInteraction(false)
        setLinkInteraction(false)
    }


    map.on(Draw.Event.CREATED, (e: DrawEvents.Created) =>
        addAction(new AddDrawLayerAction(drawnLayers, e.layer).forward())
    )
    let editAction: EditDrawLayersAction
    map.on(Draw.Event.EDITSTART, () =>
        editAction = new EditDrawLayersAction(drawnLayers).saveOld()
    )
    map.on(Draw.Event.EDITED, () =>
        addAction(editAction.saveNew())
    )
    map.on(Draw.Event.DELETED, (e: DrawEvents.Deleted) =>
        addAction(new RemoveDrawLayersAction(drawnLayers, e.layers.getLayers()).forward())
    )

    map.on(Draw.Event.DELETESTART, () =>
        (drawnLayers as any).setInteractive(true)
    )
    map.on(Draw.Event.DELETESTOP, () =>
        (drawnLayers as any).setInteractive(false)
    )
}*/