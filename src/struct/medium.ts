import { CableMediumOptions, MediumResolvable, RadioMediumOptions, SaveCableMedium, SaveMedium, SaveRadioMedium } from '../interfaces'
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
    abstract calculateLinkStats(link: Link): any
    abstract serialize(): MediumResolvable
}


export class RadioMedium extends Medium {
    public frequency: number
    public beamWidth?: number
    constructor(options: RadioMediumOptions) {
        super('radio', options.name, options.preset)
        this.frequency = options.frequency
        this.beamWidth = options.beamWidth
    }
    // TODO: Implement a prediction model i.e. Egli or Freshnel method+.
    calculateLinkStats(link: Link) {
        return {
            dBm: NaN,
            RSSI: NaN,
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
    public cableExtension: number
    public resistivity: number
    public sliceArea: number
    constructor(options: CableMediumOptions) {
        super('cable', options.name, options.preset)
        this.cableLength = options.cableLength
        this.cableExtension = options.cableExtension
        this.resistivity = options.resistivity
        this.sliceArea = options.sliceArea
    }
    calculateLinkStats(link: Link) {
        // R = (Rho) * l / A
        const cables = Math.ceil(link.stats.distance / this.cableLength)
        const length = cables * this.cableLength
        let resistance = this.resistivity * length / this.sliceArea
        if (this.cableExtension) resistance += this.cableExtension * (cables - 1)
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
            cableExtension: this.cableExtension,
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
        name: 'VHF',
        frequency: 88,
        preset: true
    }),
    new RadioMedium({
        name: 'Link1',
        frequency: 1200,
        beamWidth: 16,
        preset: true
    }),
    new RadioMedium({
        name: 'Link2',
        frequency: 4000,
        beamWidth: 6,
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
        cableExtension: 1,
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