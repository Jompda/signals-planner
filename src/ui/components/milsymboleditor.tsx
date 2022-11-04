import * as ms from 'milsymbol'
import { useRef, useState } from 'react'


export function MilSymbolEditor(props: any) {
    const symbol = props.milSymbol
        ? props.milSymbol as ms.Symbol
        : new ms.Symbol('SFGPU-------')
    const soptions = symbol.getOptions()


    const sidcRef = useRef<HTMLInputElement>()
    const uniqueDesignationRef = useRef<HTMLInputElement>()
    const higherFormationRef = useRef<HTMLInputElement>()
    const reinforcedreducedRef = useRef<HTMLInputElement>()
    const typeRef = useRef<HTMLInputElement>()
    const additionalInformationRef = useRef<HTMLInputElement>()

    let updateSvgTimeout: any = null

    const [svg, setSvg] = useState(symbol.toDataURL())

    function updateSvg() {
        symbol.setOptions({
            sidc: sidcRef.current.value,
            uniqueDesignation: uniqueDesignationRef.current.value,
            higherFormation: higherFormationRef.current.value,
            reinforcedReduced: reinforcedreducedRef.current.value,
            type: typeRef.current.value,
            additionalInformation: additionalInformationRef.current.value
        })
        if (updateSvg) clearTimeout(updateSvgTimeout)
        updateSvgTimeout = setTimeout(() => {
            setSvg(symbol.toDataURL())
            props.updateMilSymbol(symbol)
            updateSvgTimeout = null
        }, 500)
    }

    props.updateMilSymbol(symbol)

    return (
        <div className='milsymbol-editor'>
            <div className='milsymbol-editor-fields'>
                <span>SIDC:</span>
                <input
                    ref={sidcRef}
                    type='text'
                    defaultValue={soptions.sidc}
                    onChange={updateSvg}
                />
                <span>Unique Designation:</span>
                <input
                    ref={uniqueDesignationRef}
                    type='text'
                    defaultValue={soptions.uniqueDesignation}
                    onChange={updateSvg}
                />
                <span>Higher Formation:</span>
                <input
                    ref={higherFormationRef}
                    type='text'
                    defaultValue={soptions.higherFormation}
                    onChange={updateSvg}
                />
                <span>Reinforced or Reduced:</span>
                <input
                    ref={reinforcedreducedRef}
                    type='text'
                    defaultValue={soptions.reinforcedReduced}
                    onChange={updateSvg}
                />
                <span>Type:</span>
                <input
                    ref={typeRef}
                    type='text'
                    defaultValue={soptions.type}
                    onChange={updateSvg}
                />
                <span>Additional Information:</span>
                <input
                    ref={additionalInformationRef}
                    type='text'
                    defaultValue={soptions.additionalInformation}
                    onChange={updateSvg}
                />
            </div>
            <div>
                <img src={svg} />
            </div>
        </div>
    )
}