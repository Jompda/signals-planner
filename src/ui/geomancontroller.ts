import { CircleMarkerOptions, FeatureGroup, Map as LMap } from 'leaflet'
import { addAction } from '../actionhistory'
import { AddDrawLayerAction, EditDrawLayersAction, RemoveDrawLayerAction } from '../actions/drawactions'
import { setLinkInteraction, setUnitInteraction } from './structurecontroller'


let styleOptions: CircleMarkerOptions = {
    color: 'black',
    opacity: 1,
    interactive: false,
    fill: false,
    radius: 1,
    weight: 4
}
export function getDrawStyleOptions() {
    return styleOptions
}
export function setDrawStyleOptions(options: CircleMarkerOptions) {
    styleOptions = options
    drawnLayers.setStyle(options)
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
drawnLayers.on('pm:edit', () => {
    // BUG: exiting text mode causes pm:edit to fire before editAction gets created
    if(editAction) editAction.change = true
})

export function getDrawnLayers() {
    return drawnLayers
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
            : editAction.change
                ? addAction(editAction.saveNew())
                : editAction = undefined
    )
    // NOTE: Maybe add support for cut
    /*map.on('pm:globalcutmodetoggled', () =>
        map.pm.globalCutModeEnabled()
            ? editAction = new EditDrawLayersAction(drawnLayers).saveOld()
            : addAction(editAction.saveNew())
    )*/

    map.on('pm:globaldragmodetoggled', () =>
        drawnLayers.setInteractive(map.pm.globalDragModeEnabled())
    )
    map.on('pm:globalremovalmodetoggled', () =>
        drawnLayers.setInteractive(map.pm.globalRemovalModeEnabled())
    )
    map.on('pm:globalcutmodetoggled', () =>
        drawnLayers.setInteractive(map.pm.globalCutModeEnabled())
    )
}
