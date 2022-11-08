import { LatLng } from 'leaflet'
import { LinkOptions, SaveLink } from '../interfaces'
import Unit from './unit'
import { getUnitById } from '.'
import { geodesicLineStats, getGeodesicLine } from '../topoutil'


/**
 * // TODO: Separate layer from this class nd update endpoints through linklayer.ts
 */
export default class Link {
    public id: string
    public unit0: Unit
    public unit1: Unit
    public points: Array<LatLng>
    constructor(options: LinkOptions) {
        Object.assign(this, options)
        this.id = Link.createId(this.unit0, this.unit1)
    }
    static createId(unit0: Unit, unit1: Unit /* Medium etc.. */) {
        [unit0, unit1] = this.orderUnits(unit0, unit1)
        return `${unit0.id}-${unit1.id}`
    }
    static orderUnits(unit0: Unit, unit1: Unit) {
        const ll0 = unit0.latlng
        const ll1 = unit1.latlng
        if (ll0.lat + ll0.lng < ll1.lat + ll1.lng)
            return [unit1, unit0]
        return [unit0, unit1]
    }


    getPoints(endPoints: Array<LatLng>) {
        const { steps, pDist } = geodesicLineStats(endPoints[0], endPoints[1])
        const points = getGeodesicLine(endPoints[0], endPoints[1], steps)
        console.log(points, pDist)
        return points
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