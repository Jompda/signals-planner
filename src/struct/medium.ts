import { CableMediumOptions, MediumResolvable, RadioMediumOptions, SaveCableMedium, SaveMedium, SaveRadioMedium } from '../interfaces'
import { createLosGetter } from '../topoutil'
import Link from './link'


export type MediumType = 'radio' | 'cable'


export function resolveMedium(obj: MediumResolvable) {
    if (typeof obj == 'string') {
        return radios.get(obj) || cables.get(obj)
    }
    if (obj.type == 'radio') {
        if (obj instanceof Medium) return obj
        return RadioMedium.deserialize(obj)
    }
    if (obj.type == 'cable') {
        if (obj instanceof Medium) return obj
        return CableMedium.deserialize(obj)
    }
    throw new Error('Couldn\'t resolve medium!')
}


export abstract class Medium {
    public type: MediumType
    public name: string
    public preset: boolean
    constructor(type: MediumType, name: string, preset = false) {
        this.type = type
        this.name = name
        this.preset = preset
    }
    abstract estimateLinkStats(link: Link): any
    abstract serialize(): MediumResolvable
}


export class RadioMedium extends Medium {
    public frequency: number
    public beamWidth?: number
    public Pt: number
    public Gt: number
    public Gr: number
    constructor(options: RadioMediumOptions) {
        super('radio', options.name, options.preset)
        this.frequency = options.frequency
        this.beamWidth = options.beamWidth
        this.Pt = options.Pt
        this.Gt = options.Gt
        this.Gr = options.Gr
    }
    // TODO: Implement a prediction model i.e. Egli or Freshnel method+.
    // Current implementation https://en.wikipedia.org/wiki/ITU_terrain_model
    estimateLinkStats(link: Link) {
        const waveLength = (299_792_458) / (this.frequency * 1_000_000)
        const distance = link.lineStats.distance
        const values = link.values

        const srcElevation = values[0].elevation + link.emitterHeight
        const trgtElevation = values[values.length - 1].elevation + link.emitterHeight

        const iToDist = (i: number) => distance * (i / (values.length - 1)) / 1000
        const losElevationAtIndex = createLosGetter(srcElevation, trgtElevation, values.length - 1)

        let itmLoss = 0

        const R1Fmax = 274 * Math.sqrt((distance / 1000) / this.frequency)

        for (let i = 1; i < values.length - 1; i++) {
            const obstructionElevation = values[i].elevation + values[i].treeHeight
            const losElevation = losElevationAtIndex(i)
            const h = losElevation - obstructionElevation
            const d1 = iToDist(i), d2 = iToDist(values.length - 1 - i)
            if (h > R1Fmax) {
                // https://www.doria.fi/handle/10024/118719
                const R1F = 548 * Math.sqrt((d1 * d2) / (this.frequency * (d1 + d2)))
                if (h > R1F) continue // Outside 1. Fresnel zone
            }
            const F1 = 17.3 * Math.sqrt((d1 * d2) / ((this.frequency / 1000) * (distance / 1000)))
            const Cn = h / F1
            const A = 10 - 20 * Cn
            if (A > 6) itmLoss += A
        }

        // https://en.wikipedia.org/wiki/Friis_transmission_equation
        const Pr = this.Pt + this.Gt + this.Gr + 20 * Math.log10(waveLength / (4 * Math.PI * distance)) - itmLoss

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
        return new RadioMedium(obj)
    }
}


export class CableMedium extends Medium {
    public cableLength: number
    public resistivity: number
    public sliceArea: number
    constructor(options: CableMediumOptions) {
        super('cable', options.name, options.preset)
        this.cableLength = options.cableLength
        this.resistivity = options.resistivity
        this.sliceArea = options.sliceArea
    }
    estimateLinkStats(link: Link) {
        // R = (Rho) * l / A
        const cables = Math.ceil(link.lineStats.distance / this.cableLength)
        const length = cables * this.cableLength
        let resistance = this.resistivity * length / this.sliceArea
        return {
            length,
            cables,
            resistance
        }
    }


    serialize() {
        if (this.preset) return this.name
        return {
            type: this.type,
            name: this.name,
            cableLength: this.cableLength,
            resistivity: this.resistivity,
            sliceArea: this.sliceArea
        } as SaveCableMedium
    }
    static deserialize(obj: SaveCableMedium) {
        return new CableMedium(obj)
    }
}


const radioPresetArray = [
    new RadioMedium({
        name: 'VHF1',
        frequency: 88,
        Pt: 17,
        Gt: 2.15,
        Gr: 2.15,
        preset: true
    }),
    new RadioMedium({
        name: 'UHF1',
        frequency: 1200,
        beamWidth: 14,
        Pt: 10,
        Gt: 25,
        Gr: 25,
        preset: true
    }),
    new RadioMedium({
        name: 'SHF1',
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
        resistivity: 1.68 * 10 ** (-8),
        sliceArea: Math.PI * (0.010 / 2) ** 2,
        preset: true
    }),
    new CableMedium({
        name: 'Optical Fiber',
        cableLength: 500,
        resistivity: 0.1 * 10 ** (-8),
        sliceArea: Math.PI * (0.012 / 2) ** 2,
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