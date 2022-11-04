import * as L from 'leaflet'
import { LinkOptions } from '../interfaces'
import Unit from './unit'
import { createLinkLayer } from '../ui/components/linklayer'


export default class Link {
    public id: string
    public unit0: Unit
    public unit1: Unit
    public layer: L.Polyline
    constructor(options: LinkOptions) {
        Object.assign(this, options)
        this.layer = createLinkLayer(this.getEndPoints(), this)
    }
    getEndPoints() {
        return [
            this.unit0.layer.getLatLng(),
            this.unit1.layer.getLatLng()
        ]
    }
    redraw() {
        this.layer.setLatLngs(this.getEndPoints())
    }
}