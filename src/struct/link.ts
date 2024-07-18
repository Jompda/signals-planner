import { CableLinkEstimate, LineStats, LinkOptions, MediumResolvable, RadioLinkEstimate, SaveLink, SourceName, TiledataLatLng } from '../interfaces'
import Unit from './unit'
import { getValues } from '../topoutil'
import { CableMedium, RadioMedium, resolveMedium } from './medium'
import { createLosGetter, getGeodesicLine_PDist100to200, getLineStats } from '../linkutil'


export default class Link {
    public id: string
    public unit0: Unit
    public unit1: Unit
    public emitterHeight: number
    public medium: RadioMedium | CableMedium
    public values: Array<TiledataLatLng>
    public lineStats: LineStats
    public stats: RadioLinkEstimate | CableLinkEstimate
    constructor(options: LinkOptions) {
        Object.assign(this, options)
        this.medium = resolveMedium(options.medium)
        this.emitterHeight = 25 // temp
        this.reorder()
    }
    reorder() {
        const [unit0, unit1] = Link.orderUnits(this.unit0, this.unit1)
        this.unit0 = unit0
        this.unit1 = unit1
        this.id = Link.createId(this.unit0, this.unit1)
    }
    static createId(unit0: Unit, unit1: Unit /* Medium etc.. */) { // TODO: Add medium to link id generation
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


    setMedium(medium: MediumResolvable) {
        this.medium = resolveMedium(medium)
    }


    async calculate() {
        const sourceNames = ['elevation', 'treeHeight'] as Array<SourceName>
        const { latlngs, delta } = getGeodesicLine_PDist100to200(this.unit0.latlng, this.unit1.latlng)
        const values = await getValues(latlngs, sourceNames, 10)
        const lineStats = getLineStats(values, sourceNames)

        const transmitterElevation = values[0].elevation + this.emitterHeight
        const receiverElevation = values[values.length - 1].elevation + this.emitterHeight
        const losElevationAtIndex = createLosGetter(transmitterElevation, receiverElevation, values.length - 1)

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
        this.lineStats = {
            delta,
            ...lineStats,
            highestObstacle: {
                height: highestObstacle,
                index: highestObstacleI
            }
        }

        this.stats = this.medium.estimateLinkStats(this)

        return { values, lineStats: this.lineStats, stats: this.stats }
    }


    serialize() {
        return {
            unit0: this.unit0.id,
            unit1: this.unit1.id,
            medium: this.medium.serialize()
        } as SaveLink
    }
    static deserialize(obj: SaveLink, getUnitById: (unitId: string) => Unit) {
        return new Link({
            unit0: getUnitById(obj.unit0),
            unit1: getUnitById(obj.unit1),
            medium: resolveMedium(obj.medium)
        })
    }
}