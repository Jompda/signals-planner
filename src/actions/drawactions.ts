import { Circle, LatLng, latLng, Layer, LayerGroup, Marker, Polygon, Polyline } from 'leaflet'
import Action from "./action"


abstract class DrawAction extends Action {
    protected lg: LayerGroup
    constructor(lg: LayerGroup) {
        super()
        this.lg = lg
    }
}


export class AddDrawLayerAction extends DrawAction {
    private layer: Layer
    constructor(lg: LayerGroup, layer: Layer) {
        super(lg)
        this.layer = layer
    }
    forward() {
        this.lg.addLayer(this.layer)
        this.dispatchEvent('drawUpdate')
        return this
    }
    reverse() {
        this.lg.removeLayer(this.layer)
        this.dispatchEvent('drawUpdate')
        return this
    }
}


export class RemoveDrawLayerAction extends DrawAction {
    private layer: Layer
    constructor(lg: LayerGroup, layer: Layer) {
        super(lg)
        this.layer = layer
    }
    forward() {
        this.lg.removeLayer(this.layer)
        this.dispatchEvent('drawUpdate')
        return this
    }
    reverse() {
        this.lg.addLayer(this.layer)
        this.dispatchEvent('drawUpdate')
        return this
    }
}


// NOTE Instead of saving everything whenever edit starts, save only targeted layers.
let drawLayerEditId = 0
export class EditDrawLayersAction extends DrawAction {
    public change: boolean
    private layers: Array<Layer>
    private editId: number
    constructor(lg: LayerGroup) {
        super(lg)
        this.layers = lg.getLayers()
        this.editId = drawLayerEditId
    }
    saveOld() {
        return this.saveState(`editOld:${this.editId}`)
    }
    saveNew() {
        this.change = true
        drawLayerEditId++
        return this.saveState(`editNew:${this.editId}`)
    }
    saveState(fieldName: string) {
        for (const layer of this.layers) {
            if (layer instanceof Polygon) {
                (layer as any)[fieldName] = (layer.getLatLngs()[0] as Array<LatLng>).map(latlng => latLng(latlng.lat, latlng.lng))
            } else if (layer instanceof Polyline) {
                (layer as any)[fieldName] = layer.getLatLngs().map(latlng => latLng((latlng as LatLng).lat, (latlng as LatLng).lng))
            } else if (layer instanceof Circle) {
                (layer as any)[fieldName] = {
                    latlng: layer.getLatLng(),
                    radius: layer.getRadius()
                }
            } else if (layer instanceof Marker && layer.options.text) {
                (layer as any)[fieldName] = {
                    latlng: layer.getLatLng(),
                    text: layer.options.text
                }
            }
        }
        return this
    }
    forward() {
        this.apply(`editNew:${this.editId}`)
        this.dispatchEvent('drawUpdate')
        return this
    }
    reverse() {
        this.apply(`editOld:${this.editId}`)
        this.dispatchEvent('drawUpdate')
        return this
    }
    apply(fieldName: string) {
        for (const layer of this.layers) {
            if (layer instanceof Polyline) {
                layer.setLatLngs((layer as any)[fieldName])
            } else if (layer instanceof Circle) {
                const old = (layer as any)[fieldName]
                layer.setLatLng(old.latlng)
                layer.setRadius(old.radius)
            } else if (layer instanceof Marker && layer.options.text) {
                (layer as any).skipTextChange = true
                const options = (layer as any)[fieldName]
                layer.setLatLng(options.latlng)
                layer.pm.setText(options.text)
            }
        }
        return this
    }
}