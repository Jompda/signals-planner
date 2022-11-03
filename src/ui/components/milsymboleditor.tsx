import * as ms from 'milsymbol'
import { useRef, useState } from 'react'


export function MilSymbolEditor(props: any) {
    const sidcRef = useRef<HTMLInputElement>()
    const uniqueDesignationRef = useRef<HTMLInputElement>()

    let updateSvgTimeout: any = null

    let symbol = new ms.Symbol('SFGPU-------')

    const [svg, setSvg] = useState(symbol.toDataURL())

    function updateSvg() {
        symbol.setOptions({
            sidc: sidcRef.current.value,
            uniqueDesignation: uniqueDesignationRef.current.value
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
                    defaultValue={symbol.getOptions().sidc}
                    onChange={updateSvg}
                />
                <span>uniqueDesignation:</span>
                <input
                    ref={uniqueDesignationRef}
                    type='text'
                    defaultValue={''}
                    onChange={updateSvg}
                />
            </div>
            <div>
                <img src={svg} />
            </div>
        </div>
    )
}