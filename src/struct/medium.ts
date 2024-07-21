import { CableLinkEstimate, CableMediumOptions, LinkEstimateOptions, MediumOptions, MediumResolvable, MediumType, RadioLinkEstimate, RadioMediumOptions, SaveCableMedium, SaveRadioMedium } from '../interfaces'
import { createLosGetter } from '../linkutil'


export function resolveMedium(obj: MediumResolvable): RadioMedium | CableMedium {
    if (typeof obj == 'string') {
        return radios.get(obj) || cables.get(obj)
    }
    if (obj.type == 'radio') {
        if (obj instanceof Medium) return obj as RadioMedium
        return RadioMedium.deserialize(obj)
    }
    if (obj.type == 'cable') {
        if (obj instanceof Medium) return obj as CableMedium
        return CableMedium.deserialize(obj)
    }
    throw new Error('Couldn\'t resolve medium!')
}


export abstract class Medium {
    public type: MediumType
    public name: string
    public preset: boolean
    constructor(type: MediumType, options: MediumOptions) {
        this.type = type
        this.name = options.name
        this.preset = Boolean(options.preset)
    }
    abstract estimateLinkStats(options: LinkEstimateOptions): RadioLinkEstimate | CableLinkEstimate
    abstract serialize(): MediumResolvable
}


export class RadioMedium extends Medium {
    public frequency: number
    public beamWidth?: number
    public emitterHeight: number
    public Pt: number
    public Gt: number
    public Gr: number
    constructor(options: RadioMediumOptions) {
        super('radio', options)
        this.frequency = options.frequency
        this.emitterHeight = options.emitterHeight
        this.beamWidth = options.beamWidth
        this.Pt = options.Pt
        this.Gt = options.Gt
        this.Gr = options.Gr
    }


    estimateLinkStats({ lineStats, values, emitterHeight0, emitterHeight1 }: LinkEstimateOptions): RadioLinkEstimate {
        const waveLength = (299_792_458) / (this.frequency * 1_000_000)
        const distance = lineStats.distance

        const transmitterElevation = values[0].elevation + emitterHeight0
        const receiverElevation = values[values.length - 1].elevation + emitterHeight1

        let itmLoss = 0, Pr = -108
        // https://www.doria.fi/handle/10024/118719 Page 4
        const radioHorizon = 4.12 * (Math.sqrt(transmitterElevation) + Math.sqrt(receiverElevation)) * 1000

        if (distance <= radioHorizon) {
            const iToDist = (i: number) => distance * (i / (values.length - 1)) / 1000
            const losElevationAtIndex = createLosGetter(transmitterElevation, receiverElevation, values.length - 1)

            // https://en.wikipedia.org/wiki/ITU_terrain_model

            // https://www.doria.fi/handle/10024/118719 Page 4
            const R1Fmax = 274 * Math.sqrt((distance / 1000) / this.frequency)
            for (let i = 1; i < values.length - 1; i++) {
                const obstructionElevation = values[i].elevation + values[i].treeHeight
                const losElevation = losElevationAtIndex(i)
                const h = losElevation - obstructionElevation
                const d1 = iToDist(i), d2 = iToDist(values.length - 1 - i)
                if (h > R1Fmax) {
                    // https://www.doria.fi/handle/10024/118719 Page 5
                    const R1F = 548 * Math.sqrt((d1 * d2) / (this.frequency * (d1 + d2)))
                    if (h > R1F) continue // Outside 1. Fresnel zone
                }
                const F1 = 17.3 * Math.sqrt((d1 * d2) / ((this.frequency / 1000) * (distance / 1000)))
                const Cn = h / F1
                const A = 10 - 20 * Cn
                if (A > 6) itmLoss += A
            }

            // https://en.wikipedia.org/wiki/Friis_transmission_equation
            Pr = this.Pt + this.Gt + this.Gr + 20 * Math.log10(waveLength / (4 * Math.PI * distance)) - itmLoss
        }

        return {
            itmLoss,
            dB: Math.max(-108, Pr)
            //dBm: NaN,
            //RSSI: NaN,
            //CINR: NaN,
            //cost: NaN
        }
    }


    serialize() {
        if (this.preset) return this.name
        return {
            type: this.type,
            name: this.name,
            frequency: this.frequency,
            beamWidth: this.beamWidth
        } as SaveRadioMedium
    }
    static deserialize(obj: SaveRadioMedium) {
        return new RadioMedium({
            ...obj,
            emitterHeight: 25 // TODO: Get emitterheight from options
        })
    }
}


export class CableMedium extends Medium {
    public cableLength: number
    constructor(options: CableMediumOptions) {
        super('cable', options)
        this.cableLength = options.cableLength
    }

    // NOTE: Switch to on-ground-distance.
    estimateLinkStats({ lineStats }: LinkEstimateOptions): CableLinkEstimate {
        const cables = Math.ceil(lineStats.distance / this.cableLength)
        const length = cables * this.cableLength
        return {
            length,
            cables
        }
    }


    serialize() {
        if (this.preset) return this.name
        return {
            type: this.type,
            name: this.name,
            cableLength: this.cableLength
        } as SaveCableMedium
    }
    static deserialize(obj: SaveCableMedium) {
        return new CableMedium(obj)
    }
}


const radioPresetArray = [
    new RadioMedium({
        name: 'VHF1',
        emitterHeight: 4,
        frequency: 88,
        Pt: 17,
        Gt: 2.15,
        Gr: 2.15,
        preset: true
    }),
    new RadioMedium({
        name: 'UHF1',
        emitterHeight: 22,
        frequency: 1200,
        beamWidth: 14,
        Pt: 10,
        Gt: 25,
        Gr: 25,
        preset: true
    }),
    new RadioMedium({
        name: 'SHF1',
        emitterHeight: 25,
        frequency: 4000,
        beamWidth: 6,
        Pt: 10,
        Gt: 40,
        Gr: 40,
        preset: true
    })
]

const cablePresetArray = [
    new CableMedium({
        name: 'Copper',
        cableLength: 400,
        preset: true
    }),
    new CableMedium({
        name: 'Optical Fiber',
        cableLength: 500,
        preset: true
    })
]

const radios = new Map<string, RadioMedium>()
for (const radio of radioPresetArray) radios.set(radio.name, radio)
const cables = new Map<string, CableMedium>()
for (const cable of cablePresetArray) cables.set(cable.name, cable)

export {
    radios,
    cables
}