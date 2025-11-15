import {
    CableLinkEstimate,
    CableMediumOptions,
    LinkEstimateOptions,
    MediumResolvable,
    RadioLinkEstimate,
    RadioMediumOptions,
} from '../interfaces'
import {
    ITM_P2P_CR_Ex,
    resolveWarnings,
    resolveReturnCode
} from 'itm-webassembly'


const radioOptions = new Map<string, RadioMediumOptions>()
const cableOptions = new Map<string, CableMediumOptions>()


/**
 * Supports resolving correct options object from just a name string for backwards compatibility
 */
export function resolveMedium(obj: MediumResolvable): RadioMediumOptions | CableMediumOptions {
    if (typeof obj === 'string')
        return radioOptions.get(obj) || cableOptions.get(obj)
    return obj
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
export function estimateRadioLinkStats(
    { freqMhz }: RadioMediumOptions,
    { emitterHeight, lineStats, values }: LinkEstimateOptions
): RadioLinkEstimate {
    // https://github.com/NTIA/itm check README.md
    const pflRes = lineStats.delta // Approximate delta of points in meters.
    const pfl = [values.length - 1, pflRes].concat(values.map(val => val.elevation + val.treeHeight))
    //console.log('h0,h1,freq,pfl:', emitterHeight0, emitterHeight1, freqMhz, pfl)
    // NOTE: Values are kinda just thrown in there based on the itm example
    const results = ITM_P2P_CR_Ex(
        emitterHeight[0], // double h_tx__meter
        emitterHeight[1], // double h_rx__meter
        pfl, // double pfl[]
        5, // int climate temperate for Finland
        301.0, // double N_0 default is 301 equal to K=4/3
        freqMhz, // double f__mhz
        1, // int pol // TODO: Make modifiable, 0=hor 1=vert
        // TODO: Make the following values modifiable via settings.
        15.0, // double epsilon Relative permittivity 1<epsilon (15.0 = average ground)
        0.005, // double sigma Conductivity S/m 0<sigma (0.005 = average ground)
        1, // int mdvar 1 = individual
        95.0, // double confidence
        95.0, // double reliability
    ) as Map<string, string>
    //console.log(results)
    const A_fs__db = parseFloat(results.get('A_fs__db')) // free-space transmission loss
    const A_ref__db = parseFloat(results.get('A_ref__db')) // reference attentuation
    const A__db = parseFloat(results.get('A__db')) // A_fs__db + terrain loss
    const mode = parseInt(results.get('mode'))
    //const code = resolveReturnCode(parseInt(results.get('code')))
    const warnings = resolveWarnings(results.get('warnings'))

    return {
        A_fs__db,
        A_ref__db,
        A__db,
        mode,
        warnings
        //dBm: NaN,
        //RSSI: NaN,
        //CINR: NaN,
        //cost: NaN
    }
}


// NOTE: Switch to on-ground-distance.
export function estimateCableLinkStats(
    { cableLengthMeter }: CableMediumOptions,
    { lineStats }: LinkEstimateOptions
): CableLinkEstimate {
    const cables = Math.ceil(lineStats.distance / cableLengthMeter)
    const length = cables * cableLengthMeter
    return {
        length,
        cables
    }
}


// NOTE: to give a good variety to test with
// TODO: ability to save modified versions in localStorage
{
    const radioPresetArray: Array<RadioMediumOptions> = [
        {
            type: 'radio',
            name: 'HF1',
            heightMeter: 2,
            freqMhz: 3
        },
        {
            type: 'radio',
            name: 'VHF1',
            heightMeter: 4,
            freqMhz: 30
        },
        {
            type: 'radio',
            name: 'UHF1',
            heightMeter: 25,
            freqMhz: 300,
            beamWidthDeg: 20
        },
        {
            type: 'radio',
            name: 'SHF1',
            heightMeter: 25,
            freqMhz: 3000,
            beamWidthDeg: 10
        }
    ]
    const cablePresetArray: Array<CableMediumOptions> = [
        {
            type: 'cable',
            name: 'Copper',
            cableLengthMeter: 500
        },
        {
            type: 'cable',
            name: 'Optical Fiber',
            cableLengthMeter: 500
        }
    ]
    for (const radio of radioPresetArray) radioOptions.set(radio.name, radio)
    for (const cable of cablePresetArray) cableOptions.set(cable.name, cable)
}

export {
    radioOptions,
    cableOptions
}
