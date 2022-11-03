import * as ms from 'milsymbol'
import { useRef, useState } from 'react'


export function SidcEditor(props: any) {
    const sidcRef = useRef<HTMLInputElement>()
    const uniqueDesignationRef = useRef<HTMLInputElement>()

    let updateSvgTimeout: any = null

    let sidc = 'SFGPU-------'
    let symbol = new ms.Symbol(sidc)

    const [svg, setSvg] = useState(symbol.toDataURL())

    function updateSvg() {
        symbol.setOptions({
            sidc: sidcRef.current.value,
            uniqueDesignation: uniqueDesignationRef.current.value
        })
        if (updateSvg) clearTimeout(updateSvgTimeout)
        updateSvgTimeout = setTimeout(() => {
            setSvg(symbol.toDataURL())
            updateSvgTimeout = null
        }, 500)
    }

    return (
        <div className='sidc-editor'>
            <div className='sidc-editor-fields'>
                <span>SIDC:</span>
                <input
                    ref={sidcRef}
                    type='text'
                    defaultValue={sidc}
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