import LinkLayer from './ui/components/linklayer'
import { asyncOperation, getMaxWorkers, workers } from './util'
import { linkIdExists, removeLink as structRemoveLink, addLink as structAddLink } from './struct'
import { getLinkLayerById, removeLink as lgRemoveLink, addLink as lgAddLink } from './ui/structurecontroller'
import UnitLayer from './ui/components/unitlayer'
import { Medium } from './struct/medium'
import Link from './struct/link'



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

    let current = 0
    const check = asyncOperation(
        linkLayers.length,
        () => progressFunction(++current / linkLayers.length),
        () => done(linkLayers)
    )

    workers(linkLayers, async (linkLayer: LinkLayer) => {
        await linkLayer.update()
        if (linkLayer.link.stats.dB < minDB) return check()
        structAddLink(linkLayer.link)
        lgAddLink(linkLayer)
        check()
    }, getMaxWorkers())
}