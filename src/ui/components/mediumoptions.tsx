import { useRef } from "react"
import { radioOptions, cableOptions, resolveMedium } from "../../struct/medium"
import { getSetting } from "../../settings"
import { RadioMediumOptions } from "../../interfaces"


export function MediumOptions({ sourceOnly, defaultMedium, updateMedium, defaultEmitterHeight0, updateEmitterHeight0, defaultEmitterHeight1, updateEmitterHeight1 }: {
    sourceOnly?: boolean
    defaultMedium?: string
    updateMedium: (str: string) => any
    defaultEmitterHeight0?: number
    updateEmitterHeight0: (value: number) => any
    defaultEmitterHeight1?: number
    updateEmitterHeight1?: (value: number) => any
}) {
    const selectRef = useRef<HTMLSelectElement>()
    const emRef = useRef<HTMLDivElement>()
    const em0Ref = useRef<HTMLInputElement>()
    const em1Ref = useRef<HTMLInputElement>()

    const radioGroup = new Array<JSX.Element>()
    const cableGroup = new Array<JSX.Element>()
    for (const radio of radioOptions.values()) {
        radioGroup.push(
            <option
                key={radio.name}
                value={radio.name}
            >{radio.name}: {radio.freqMhz}MHz {radio.beamWidthDeg ? 'Directing ' + radio.beamWidthDeg + '°' : ''}</option>
        )
    }
    for (const cable of cableOptions.values()) {
        cableGroup.push(
            <option
                key={cable.name}
                value={cable.name}
            >{cable.name}: {cable.cableLengthMeter}m</option>
        )
    }

    const dlm = getSetting('defaultLinkMedium') as string
    const deh = getSetting('defaultEmitterHeight') as number

    updateMedium(defaultMedium || dlm)
    updateEmitterHeight0(defaultEmitterHeight0 || deh)
    updateEmitterHeight1(defaultEmitterHeight1 || deh)

    return (
        <div className="medium-options">
            <select
                ref={selectRef}
                defaultValue={defaultMedium || dlm}
                onChange={() => {
                    const medium = resolveMedium(selectRef.current.value)
                    emRef.current.style.visibility = (medium.type === 'cable') ? 'hidden' : 'visible'
                    updateMedium(selectRef.current.value) // NOTE: ends with useless repetition on higher layers
                    if (medium.type === 'radio') {
                        em0Ref.current.value = String((medium as RadioMediumOptions).heightMeter)
                        em1Ref.current.value = String((medium as RadioMediumOptions).heightMeter)
                        updateEmitterHeight0((medium as RadioMediumOptions).heightMeter)
                        updateEmitterHeight1((medium as RadioMediumOptions).heightMeter)
                    }
                }}
            >
                <optgroup label='Radios'>{radioGroup}</optgroup>
                <optgroup label='Cables'>{cableGroup}</optgroup>
            </select>
            <div ref={emRef} style={{visibility: (resolveMedium(defaultMedium || dlm).type === 'cable') ? 'hidden' : 'visible'}}>
                <span>{sourceOnly ? 'Emitter height (m):' : 'Source emitter height (m):'}</span>
                <input
                    ref={em0Ref}
                    type='number'
                    defaultValue={defaultEmitterHeight0 || deh}
                    onInput={() => updateEmitterHeight0(parseFloat(em0Ref.current.value))} />
                {sourceOnly ? undefined :
                    <>
                        <span>Target emitter height (m):</span>
                        <input
                            ref={em1Ref}
                            type='number'
                            defaultValue={defaultEmitterHeight1 || deh}
                            onInput={() => updateEmitterHeight1(parseFloat(em1Ref.current.value))} />
                    </>
                }
            </div>
        </div>
    )
}