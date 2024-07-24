import { CableLinkEstimate, LineStats, LinkOptions, MediumResolvable, RadioLinkEstimate, SaveLink, SourceName, TiledataLatLng } from '../interfaces'
import Unit from './unit'
import { getValues } from '../topoutil'
import { CableMedium, RadioMedium, resolveMedium } from './medium'
import { createLosGetter, getGeodesicLine, getGeodesicLineStats, getLineStats } from '../linkutil'
import { getSetting } from '../settings'


export default class Link {
    public id: string
    public unit0: Unit
    public unit1: Unit
    public emitterHeight0: number
    public emitterHeight1: number
    public medium: RadioMedium | CableMedium
    public values: Array<TiledataLatLng>
    public lineStats: LineStats
    public stats: RadioLinkEstimate | CableLinkEstimate
    constructor(options: LinkOptions) {
        Object.assign(this, options)
        this.medium = resolveMedium(options.medium)
        this.reorder()
    }
    reorder() {
        const [unit0, unit1] = Link.orderUnits(this.unit0, this.unit1)
        if (unit0.id !== this.unit0.id) {
            const temp = this.emitterHeight0
            this.emitterHeight0 = this.emitterHeight1
            this.emitterHeight1 = temp
        }
        this.unit0 = unit0
        this.unit1 = unit1
        this.id = Link.createId(this.unit0, this.unit1)
    }
    static createId(unit0: Unit, unit1: Unit) {
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
        const { steps, delta } = getGeodesicLineStats(this.unit0.latlng, this.unit1.latlng, 200)
        const latlngs = getGeodesicLine(this.unit0.latlng, this.unit1.latlng, steps)
        const values = await getValues(latlngs, sourceNames, 10)
        const lineStats = getLineStats(values, sourceNames)

        const transmitterElevation = values[0].elevation + this.emitterHeight0
        const receiverElevation = values[values.length - 1].elevation + this.emitterHeight1
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
            emitterHeight0: this.emitterHeight0,
            emitterHeight1: this.emitterHeight1,
            medium: this.medium.serialize()
        } as SaveLink
    }
    static deserialize(obj: SaveLink, getUnitById: (unitId: string) => Unit) {
        const defaultEmitterHeight = getSetting('defaultEmitterHeight') as number
        return new Link({
            unit0: getUnitById(obj.unit0),
            unit1: getUnitById(obj.unit1),
            emitterHeight0: obj.emitterHeight0 || defaultEmitterHeight,
            emitterHeight1: obj.emitterHeight1 || defaultEmitterHeight,
            medium: resolveMedium(obj.medium)
        })
    }
}