import { CableMediumOptions, MediumResolvable, RadioMediumOptions, SaveCableMedium, SaveMedium, SaveRadioMedium } from '../interfaces'
import Link from './link'


export type MediumType = 'radio' | 'cable'


export function resolveMedium(obj: MediumResolvable) {
    let resolved: RadioMedium | CableMedium
    if (typeof obj == 'string') {
        return radioPresets.get(obj) || cablePresets.get(obj)
    }
    if (obj.type == 'radio') {
        if (obj instanceof Medium) return obj
        return RadioMedium.deserialize(obj)
    }
    if (obj.type == 'cable') {
        if (obj instanceof Medium) return obj
        return CableMedium.deserialize(obj)
    }
    throw new Error('Unresolvable SaveMedium object!')
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
            CINR: NaN,
            cost: NaN
        }
    }


    serialize() {
        if (this.preset) return this.name
        return {
            type: 'radio',
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
    public cableCost: number
    public resistance: number
    constructor(options: CableMediumOptions) {
        super('cable', options.name, options.preset)
        this.cableLength = options.cableLength
        this.cableCost = options.cableCost
        this.resistance = options.resistance
    }
    calculateLinkStats(link: Link) {
        const length = Math.floor(link.stats.distance / this.cableLength) * this.cableLength
        const resistance = 1.68 * (10 ** (-8)) * length / ((3.14 * (10 ** (-3))) ** 2)
        return {
            length,
            resistance,
            cost: this.cableCost + resistance * length
        }
    }


    serialize() {
        if (this.preset) return this.name
        return {
            type: 'cable',
            name: this.name,
            cableLength: this.cableLength,
            cableCost: this.cableCost,
            resistance: this.resistance
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
]

const cablePresetArray = [
    new CableMedium({
        name: 'Copper',

        cableLength: 400,
        cableCost: 2000,
        resistance: 68,
        preset: true
    })
]

const radioPresets = new Map<string, RadioMedium>()
for (const radio of radioPresetArray) radioPresets.set(radio.name, radio)
const cablePresets = new Map<string, CableMedium>()
for (const cable of cablePresetArray) cablePresets.set(cable.name, cable)

export {
    radioPresets,
    cablePresets
}