import { Circle, Control, Draw, DrawEvents, DrawOptions, FeatureGroup, Map as LMap } from "leaflet"
import { addAction } from "./actionhistory"
import { AddDrawLayerAction, EditDrawLayersAction, RemoveDrawLayersAction } from "./actions/drawactions"
import { setLinkInteraction, setUnitInteraction } from "./ui/structurecontroller"


// TODO: Add a text writing tool

export function initDraw(map: LMap) {
    // TODO: Ability to save and load leaflet-draw:ings
    const drawnLayers = new FeatureGroup().addTo(map)

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

    const drawControl = new Control.Draw({
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
    }).addTo(map)

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
}