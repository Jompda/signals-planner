import { LineStats, LinkOptions, SaveLink } from '../interfaces'
import Unit from './unit'
import { getUnitById } from '.'
import { createLosGetter, getGeodesocLine_PDist100to200, getLineStats, getValues } from '../topoutil'
import { SourceName } from '..'


export default class Link {
    public id: string
    public unit0: Unit
    public unit1: Unit
    public emitterHeight: number
    public values: Array<any>
    public stats: LineStats
    constructor(options: LinkOptions) {
        Object.assign(this, options)
        this.reorder()
        this.emitterHeight = 25 // temp
    }
    reorder() {
        const [unit0, unit1] = Link.orderUnits(this.unit0, this.unit1)
        this.unit0 = unit0
        this.unit1 = unit1
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
        const sourceNames = ['elevation', 'treeHeight'] as Array<SourceName>
        const { latlngs, delta } = getGeodesocLine_PDist100to200(this.unit0.latlng, this.unit1.latlng)
        const values = await getValues(latlngs, sourceNames, 10)
        const lineStats = getLineStats(values, sourceNames)

        const unit0Elevation = values[0].elevation + this.emitterHeight
        const unit1Elevation = values[values.length - 1].elevation + this.emitterHeight
        const losElevationAtIndex = createLosGetter(unit0Elevation, unit1Elevation, values.length - 1)

        let highestObstacle = lineStats.peaks.values[0] - losElevationAtIndex(1)
        let highestObstacleI = 0
        for (let i = 1; i < lineStats.peaks.indexes.length; i++) {
            const obstacle = lineStats.peaks.values[i] - losElevationAtIndex(lineStats.peaks.indexes[i] + 1)
            if (obstacle > highestObstacle) {
                highestObstacle = obstacle
                highestObstacleI = i
            }
        }

        this.values = values
        this.stats = {
            delta,
            ...lineStats,
            highestObstacle: {
                height: highestObstacle,
                index: highestObstacleI
            }
        }

        return { values, stats: this.stats }
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