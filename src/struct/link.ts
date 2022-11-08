import { LatLng } from 'leaflet'
import { LinkOptions, SaveLink } from '../interfaces'
import Unit from './unit'
import { getUnitById } from '.'
import { getGeodesocLine_PDist100to200, getLineStats, getValues } from '../topoutil'


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


    async calculate() {
        const { latlngs, delta } = getGeodesocLine_PDist100to200(this.unit0.latlng, this.unit1.latlng)
        const values = await getValues(latlngs, ['elevation', 'treeHeight'], 10)
        const lineStats = getLineStats(values, 'elevation')
        console.log(delta, values, lineStats)

        const unit0Elevation = values[0].elevation
        const unit1Elevation = values[values.length - 1].elevation
        const elevationDelta = unit1Elevation - unit0Elevation

        function losElevationAtIndex(i: number) {
            return unit0Elevation + (elevationDelta * (i / (values.length - 1)))
        }

        let highestObstacle = lineStats.peaks.values[0] - losElevationAtIndex(1)
        let highestObstacleI = 0
        for (let i = 1; i < lineStats.peaks.indexes.length; i++) {
            const losElevation = losElevationAtIndex(lineStats.peaks.indexes[i] + 1)
            const obstacle = lineStats.peaks.values[i] - losElevation
            if (obstacle > highestObstacle) {
                highestObstacle = obstacle
                highestObstacleI = i
            }
        }

        return highestObstacle
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