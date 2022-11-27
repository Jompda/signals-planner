import { useRef } from "react"
import { cables, radios } from "../../struct/medium"


export function MediumSelector(props: any) {
    const selectRef = useRef<HTMLSelectElement>()
    let first: string

    const radioGroup = new Array<JSX.Element>()
    const cableGroup = new Array<JSX.Element>()
    for (const radio of radios.values()) {
        if (!first) first = radio.name
        radioGroup.push(
            <option
                key={radio.name}
                value={radio.name}
            >{radio.name}: {radio.frequency}MHz {radio.beamWidth ? 'Directing ' + radio.beamWidth + '°' : ''}</option>
        )
    }
    for (const cable of cables.values()) {
        if (!first) first = cable.name
        cableGroup.push(
            <option
                key={cable.name}
                value={cable.name}
            >{cable.name}: {cable.cableLength}m {cable.resistivity}Ω</option>
        )
    }

    props.updateMedium(props.defaultValue || first)

    return (
        <select
            ref={selectRef}
            defaultValue={props.defaultValue}
            onChange={() => props.updateMedium(selectRef.current.value)}
        >
            <optgroup label='Radios'>{radioGroup}</optgroup>
            <optgroup label='Cables'>{cableGroup}</optgroup>
        </select>
    )
}