import { Layer, LayerGroup } from "leaflet"
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