import { CableLinkEstimate, CableMediumOptions, LinkEstimateOptions, MediumOptions, MediumResolvable, MediumType, RadioLinkEstimate, RadioMediumOptions, SaveCableMedium, SaveRadioMedium } from '../interfaces'


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



    /**
     * Sources:
     * Comparison of ITU-R and ITM-Longley-Rice
     * https://ieeexplore.ieee.org/document/6873518
     * 
     * ITM-Longley-Rice
     * https://github.com/NTIA/itm
     * http://radiomobile.pe1mew.nl/?Calculations___ITM_model_propagation_settings
     * https://en.wikipedia.org/wiki/Longley%E2%80%93Rice_model
     * https://www.softwright.com/support/faq/underlying-calculations-parameters-assumptions-longley-rice-itm-propagation-model/
     * https://www.ingenieros.cl/wp-content/uploads/2018/11/2do-Paper-IEEE_Mod.ITM_V2.8.1-paper-7.pdf
     * 
     * ITU-R, rough implementation can be found from commit 1ade859ba3d154ef4ab513a15089026f60bff239 Wed Jul 24 20:11:01 2024 +0300
     * https://en.wikipedia.org/wiki/ITU_terrain_model
     * https://www.itu.int/dms_pubrec/itu-r/rec/p/R-REC-P.530-18-202109-I!!PDF-E.pdf
     * 
     * Other
     * https://www.doria.fi/handle/10024/118719
     * https://en.wikipedia.org/wiki/Friis_transmission_equation
     * http://wiki.towercoverage.com/wiki/110/propagation-model-description
     * 
     * // TODO: Improve estimateLinkStats
     * - With line-of-sight connection, take into account multipath interference
     */
    estimateLinkStats({ lineStats, values, emitterHeight0, emitterHeight1 }: LinkEstimateOptions): RadioLinkEstimate {
        // https://github.com/NTIA/itm check README.md
        const pflRes = lineStats.delta // Approximate delta of points in meters.
        const pfl = [values.length - 1, pflRes].concat(values.map(val => val.elevation + val.treeHeight))
        //console.log('h0,h1,freq,pfl:', emitterHeight0, emitterHeight1, this.frequency, pfl)
        const results = window.ITM_P2P_TLS_Ex(
            emitterHeight0, // double h_tx__meter
            emitterHeight1, // double h_rx__meter
            pfl, // double pfl[]
            5, // int climate temperate for Finland
            301.0, // double N_0 default is 301 equal to K=4/3
            this.frequency, // double f__mhz
            1, // int pol // TODO: Make modifiable, 0=hor 1=vert
            // TODO: Figure out the following values
            15.0, // double epsilon Relative permittivity 1<epsilon (15.0 = average ground)
            0.005, // double sigma Conductivity S/m 0<sigma (0.005 = average ground)
            1, // int mdvar 1 = individual
            50.0, // double time
            50.0, // double location
            50.0 // double situation
        )
        //console.log(results)
        const A_fs__db = parseFloat(results.get('A_fs__db')) // free-space transmission loss
        const A_ref__db = parseFloat(results.get('A_ref__db')) // reference attentuation
        const A__db = parseFloat(results.get('A__db')) // A_fs__db + terrain loss
        const mode = parseInt(results.get('mode'))
        // TODO: parse warnings

        return {
            A_fs__db,
            A_ref__db,
            A__db,
            mode
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