import { Circle, LatLng, latLng, Layer, LayerGroup, Polygon, Polyline, Rectangle } from "leaflet"
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
        return this
    }
    reverse() {
        this.lg.removeLayer(this.layer)
        return this
    }
}


export class RemoveDrawLayersAction extends DrawAction {
    private layers: Array<Layer>
    constructor(lg: LayerGroup, layers: Array<Layer>) {
        super(lg)
        this.layers = layers
    }
    forward() {
        for (const layer of this.layers)
            this.lg.removeLayer(layer)
        return this
    }
    reverse() {
        for (const layer of this.layers)
            this.lg.addLayer(layer)
        return this
    }
}


let drawLayerEditId = 0
export class EditDrawLayersAction extends DrawAction {
    private layers: Array<Layer>
    private editId: number
    constructor(lg: LayerGroup) {
        super(lg)
        this.layers = lg.getLayers()
        this.editId = drawLayerEditId++
    }
    saveOld() {
        for (const layer of this.layers) {
            if (layer instanceof Polygon) {
                console.log('Polygon', layer);
                (layer as any)[`editOld:${this.editId}`] = (layer.getLatLngs()[0] as Array<LatLng>).map(latlng => latLng(latlng.lat, latlng.lng))
            } else if (layer instanceof Polyline) {
                console.log('Polyline', layer);
                (layer as any)[`editOld:${this.editId}`] = layer.getLatLngs().map(latlng => latLng((latlng as LatLng).lat, (latlng as LatLng).lng))
            } else if (layer instanceof Circle) {
                console.log('Circle', layer);
                (layer as any)[`editOld:${this.editId}`] = {
                    latlng: layer.getLatLng(),
                    radius: layer.getRadius()
                }
            }
        }
        return this
    }
    saveNew() {
        for (const layer of this.layers) {
            if (layer instanceof Polygon) {
                console.log('Polygon', layer);
                (layer as any)[`editNew:${this.editId}`] = (layer.getLatLngs()[0] as Array<LatLng>).map(latlng => latLng(latlng.lat, latlng.lng))
            } else if (layer instanceof Polyline) {
                console.log('Polyline', layer);
                (layer as any)[`editNew:${this.editId}`] = layer.getLatLngs().map(latlng => latLng((latlng as LatLng).lat, (latlng as LatLng).lng))
            } else if (layer instanceof Circle) {
                console.log('Circle', layer);
                (layer as any)[`editNew:${this.editId}`] = {
                    latlng: layer.getLatLng(),
                    radius: layer.getRadius()
                }
            }
        }
        return this
    }
    forward() {
        for (const layer of this.layers) {
            if (layer instanceof Polyline) {
                layer.setLatLngs((layer as any)[`editNew:${this.editId}`])
            } else if (layer instanceof Circle) {
                const old = (layer as any)[`editNew:${this.editId}`]
                layer.setLatLng(old.latlng)
                layer.setRadius(old.radius)
            }
        }
        return this
    }
    reverse() {
        for (const layer of this.layers) {
            if (layer instanceof Polyline) {
                layer.setLatLngs((layer as any)[`editOld:${this.editId}`])
            } else if (layer instanceof Circle) {
                const old = (layer as any)[`editOld:${this.editId}`]
                layer.setLatLng(old.latlng)
                layer.setRadius(old.radius)
            }
        }
        return this
    }
}