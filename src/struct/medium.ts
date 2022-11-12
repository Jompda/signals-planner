import Link from './link'


export type MediumType = 'radio' | 'cable'


export abstract class Medium {
    public type: MediumType
    constructor(type: MediumType) {
        this.type = type
    }
    abstract calculateLinkStats(link: Link): any
}


export interface RadioMediumOptions {
    frequency: number
    beamWidth?: number
}
export class RadioMedium extends Medium {
    public frequency: number
    public beamWidth?: number
    constructor(options: RadioMediumOptions) {
        super('radio')
        Object.apply(this, options)
    }
    // TODO: Implement a prediction model i.e. Egli.
    calculateLinkStats(link: Link) {
        return {
            dBm: NaN,
            RSSI: NaN,
            CINR: NaN,
            cost: NaN
        }
    }
}


export interface CableMediumOptions {
    baseCost: number
    distanceMultiplier: number
}
export class CableMedium extends Medium {
    public baseCost: number
    public distanceMultiplier: number
    constructor(options: CableMediumOptions) {
        super('cable')
        Object.apply(this, options)
    }
    calculateLinkStats(link: Link) {
        return {
            cost: NaN
        }
    }
}