import LinkLayer from './ui/components/linklayer'
import { asyncOperation, getMaxWorkers, workers } from './util'
import { linkIdExists, removeLink as structRemoveLink, addLink as structAddLink } from './struct'
import { getLinkLayerById, removeLink as lgRemoveLink, addLink as lgAddLink } from './ui/structurecontroller'
import UnitLayer from './ui/components/unitlayer'
import { Medium } from './struct/medium'
import Link from './struct/link'
import LatLon from 'geodesy/latlon-spherical'
import { latLng } from 'leaflet'
import { CableLinkEstimate, RadioLinkEstimate, SourceName, TiledataLatLng } from './interfaces'
import Unit from './struct/unit'


export function generateMatrix(units: Array<Unit>, links: Array<Link>, linkToValue: (link: Link) => string) {
    console.log('units:', units.length)
    console.log('links:', links.length)

    function unitPair(unit0: Unit, unit1: Unit) {
        if (unit0.id > unit1.id) return unit1.id + '|' + unit0.id
        else return unit0.id + '|' + unit1.id;
    }

    const pairs = new Map<string, string>()
    for (const link of links) pairs.set(unitPair(link.unit0, link.unit1), linkToValue(link))

    const lines = new Array<Array<string>>()
    lines.push(['', ...units.map(unit => unit.id)])
    for (const unit1 of units) {
        const line = new Array<string>()
        lines.push(line)
        line.push(unit1.id)
        for (const unit0 of units)
            line.push(pairs.get(unitPair(unit0, unit1)) || '')
    }

    console.log(pairs)
    return lines
}


export function generateLinkLayers(
    unitLayers: Array<UnitLayer>,
    minDist: number,
    maxDist: number,
    minDB: number,
    medium: Medium,
    override: boolean,
    progressFunction: (i: number) => any,
    done: (linkLayers: Array<LinkLayer>) => any
) {
    const linkLayers = new Array<LinkLayer>()
    for (let i = 0; i < unitLayers.length; i++) {
        for (let j = i + 1; j < unitLayers.length; j++) {
            const [unitLayer0, unitLayer1] = LinkLayer.orderUnitLayers(unitLayers[i], unitLayers[j])
            const dist = unitLayer0.unit.latlng.distanceTo(unitLayer1.unit.latlng)
            if (dist < minDist || dist > maxDist) continue
            const link = new Link({
                unit0: unitLayer0.unit,
                unit1: unitLayer1.unit,
                medium
            })
            if (linkIdExists(link.id)) {
                if (override) {
                    const oldLinkLayer = getLinkLayerById(link.id)
                    structRemoveLink(oldLinkLayer.link)
                    lgRemoveLink(oldLinkLayer)
                } else {
                    continue
                }
            }
            const linkLayer = new LinkLayer(link, unitLayer0, unitLayer1)
            linkLayers.push(linkLayer)
        }
    }

    const check = asyncOperation(
        linkLayers.length,
        progressFunction,
        () => done(linkLayers)
    )

    workers(linkLayers, async (linkLayer: LinkLayer) => {
        await linkLayer.update()
        if ((linkLayer.link.stats as RadioLinkEstimate).dB < minDB) return check()
        structAddLink(linkLayer.link)
        lgAddLink(linkLayer)
        check()
    }, getMaxWorkers())
}


export function createLosGetter(elevation0: number, elevation1: number, lastIndex: number) {
    const elevationDelta = elevation1 - elevation0
    return (i: number) => elevation0 + (elevationDelta * (i / lastIndex))
}


export function getLineStats(latlngs: Array<TiledataLatLng>, sourceNames: Array<SourceName>) {
    function sumAt(i: number) {
        let sum = 0
        for (let j = 0; j < sourceNames.length; j++)
            sum += latlngs[i][sourceNames[j]]
        return sum
    }

    const distance = latlngs[0].latlng.distanceTo(latlngs[latlngs.length - 1].latlng)
    const extremes = {
        min: sumAt(0),
        iMin: 0,
        max: sumAt(0),
        iMax: 0
    }
    for (let i = 1; i < latlngs.length; i++) {
        const temp = sumAt(i)
        if (temp < extremes.min) {
            extremes.min = temp
            extremes.iMin = i
        }
        if (temp > extremes.max) {
            extremes.max = temp
            extremes.iMax = i
        }
    }

    const peaks = {
        values: new Array<number>(),
        indexes: new Array<number>()
    }
    for (let i = 1; i < latlngs.length - 1; i++) {
        const temp = sumAt(i)
        if (temp <= sumAt(i - 1)) continue
        if (temp <= sumAt(i + 1)) continue
        peaks.indexes.push(i)
        peaks.values.push(temp)
    }

    return {
        distance,
        extremes,
        peaks
    }
}


export function getGeodesocLine_PDist100to200(latlng0: LatLng, latlng1: LatLng) {
    const { steps, delta } = geodesicLineStats(latlng0, latlng1)
    const latlngs = getGeodesicLine(latlng0, latlng1, steps)
    return { latlngs, delta }
}


export function geodesicLineStats(latlng0: LatLng, latlng1: LatLng) {
    const distance = new LatLon(latlng0.lat, latlng0.lng).distanceTo(new LatLon(latlng1.lat, latlng1.lng))
    const steps = Math.floor(Math.log2(distance / 100)) // delta: min 100, max 2*100=200 meters
    const delta = distance / (2 ** steps)
    return { steps, delta }
}


export function getGeodesicLine(latlng0: LatLng, latlng1: LatLng, steps: number) {
    const amount = 2 ** steps - 1
    const p0 = new LatLon(latlng0.lat, latlng0.lng)
    const p1 = new LatLon(latlng1.lat, latlng1.lng)
    const points = Array(amount)

    rmp(p0, p1, 0, amount, 0)
    function rmp(p0: LatLon, p1: LatLon, i0: number, i1: number, d: number) {
        if (d >= steps) return
        const value = p0.midpointTo(p1)
        const ci = Math.floor((i0 + i1) / 2)
        points[ci] = value
        rmp(p0, value, i0, ci, d + 1)
        rmp(value, p1, ci, i1, d + 1)
    }

    return [p0, ...points, p1].map((latlon: LatLon) => latLng(latlon.lat, latlon.lon))
}