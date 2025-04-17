import { CableLinkEstimate, CableMediumOptions, LineStats, LinkOptions, MediumResolvable, RadioLinkEstimate, RadioMediumOptions, SaveLink, SourceName, TiledataLatLng } from '../interfaces'
import Unit from './unit'
import { getValues } from '../topoutil'
import { estimateCableLinkStats, estimateRadioLinkStats, resolveMedium } from './medium'
import { createLosGetter, getGeodesicLine, getGeodesicLineStats, getLineStats } from '../linkutil'
import { getSetting } from '../settings'
import LatLon from 'geodesy/latlon-spherical'
import { sealedArray } from '../util'


export default class Link {
    public id: string
    // NOTE: Change to arrays of size 2? Would it just clutter the program due to javascript object?
    public unit = sealedArray<Unit>(2)
    public emitterHeight = sealedArray<number>(2)
    public bearing = sealedArray<number>(2)
    public medium: RadioMediumOptions | CableMediumOptions
    public values: Array<TiledataLatLng>
    public lineStats: LineStats
    public stats: RadioLinkEstimate | CableLinkEstimate
    constructor(options: LinkOptions) {
        this.unit[0] = options.unit0
        this.unit[1] = options.unit1
        this.emitterHeight[0] = options.emitterHeight0
        this.emitterHeight[1] = options.emitterHeight1
        this.medium = resolveMedium(options.medium)
        this.reorder()
    }
    reorder() {
        const unit = Link.orderUnits.call(null, ...this.unit) as Array<Unit>
        if (unit[0].id !== this.unit[0].id) {
            this.unit = this.unit.reverse()
            this.emitterHeight = this.emitterHeight.reverse()
        }
        this.id = Link.createId.call(null, ...this.unit)
    }
    static createId(unit0: Unit, unit1: Unit) {
        [unit0, unit1] = Link.orderUnits(unit0, unit1)
        return `${unit0.id}-${unit1.id}`
    }
    /**
     * Used to internally order units so comparison based on link id is easier.
     * // NOTE: Funny business could happen with the current logic.
     * 
     * @param unit0 
     * @param unit1 
     * @returns 
     */
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
        const { steps, delta } = getGeodesicLineStats(this.unit[0].latlng, this.unit[1].latlng, 200)
        const latlngs = getGeodesicLine(this.unit[0].latlng, this.unit[1].latlng, steps)
        const values = await getValues(latlngs, sourceNames, 10)
        const lineStats = getLineStats(values, sourceNames)

        const transmitterElevation = values[0].elevation + this.emitterHeight[0]
        const receiverElevation = values[values.length - 1].elevation + this.emitterHeight[1]
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

        const ll0 = new LatLon(this.unit[0].latlng.lat, this.unit[0].latlng.lng)
        const ll1 = new LatLon(this.unit[1].latlng.lat, this.unit[1].latlng.lng)
        this.bearing[0] = ll0.initialBearingTo(ll1)
        this.bearing[1] = ll1.initialBearingTo(ll0)

        this.stats = this.medium.type === 'radio' ?
            estimateRadioLinkStats(this.medium as RadioMediumOptions, this)
            : estimateCableLinkStats(this.medium as CableMediumOptions, this)

        return { values, lineStats: this.lineStats, stats: this.stats }
    }


    serialize() {
        return {
            unit0: this.unit[0].id,
            unit1: this.unit[1].id,
            emitterHeight0: this.emitterHeight[0],
            emitterHeight1: this.emitterHeight[1],
            medium: this.medium
        } as SaveLink
    }
    static deserialize(obj: SaveLink, getUnitById: (unitId: string) => Unit) {
        const defaultEmitterHeight = getSetting('defaultEmitterHeight') as number
        return new Link({
            unit0: getUnitById(obj.unit0),
            unit1: getUnitById(obj.unit1),
            emitterHeight0: obj.emitterHeight0 || defaultEmitterHeight,
            emitterHeight1: obj.emitterHeight1 || defaultEmitterHeight,
            // NOTE: For backwards compatibility this resolves MediumOptions from just a name
            medium: resolveMedium(obj.medium)
        })
    }
}