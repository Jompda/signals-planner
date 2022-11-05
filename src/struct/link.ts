import * as L from 'leaflet'
import { LinkOptions, SaveLink } from '../interfaces'
import Unit from './unit'
import { createLinkLayer } from '../ui/components/linklayer'
import { getUnitById } from '.'


export default class Link {
    public id: string
    public unit0: Unit
    public unit1: Unit
    public layer: L.Polyline
    constructor(options: LinkOptions) {
        Object.assign(this, options)
        this.id = Link.createId(this.unit0, this.unit1)
        this.layer = createLinkLayer(this.getEndPoints(), this)
    }
    static createId(unit0: Unit, unit1: Unit /* Medium etc.. */) {
        [unit0, unit1] = this.orderUnits(unit0, unit1)
        return `${unit0.id}-${unit1.id}`
    }
    static orderUnits(unit0: Unit, unit1: Unit) {
        const ll0 = unit0.layer.getLatLng()
        const ll1 = unit1.layer.getLatLng()
        if (ll0.lat + ll0.lng < ll1.lat + ll1.lng)
            return [unit1, unit0]
        return [unit0, unit1]
    }
    getEndPoints() {
        return [
            this.unit0.layer.getLatLng(),
            this.unit1.layer.getLatLng()
        ]
    }
    update() {
        const [u0, u1] = Link.orderUnits(this.unit0, this.unit1)
        this.id = Link.createId(u0, u1)
        this.unit0 = u0
        this.unit1 = u1
        this.layer.setLatLngs(this.getEndPoints())
    }


    serialize() {
        return {
            unit0: this.unit0.id,
            unit1: this.unit1.id
        } as SaveLink
    }
    static deserialize(obj: SaveLink) {
        return new Link({
            unit0: getUnitById(obj.unit0),
            unit1: getUnitById(obj.unit1)
        })
    }
}