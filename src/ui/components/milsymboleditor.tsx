import * as ms from 'milsymbol'
import { useRef, useState } from 'react'


interface Field {
    title: string
    option: keyof ms.SymbolOptions
}


// SIDC explained
// https://help.perforce.com/visualization/jviews/8.9/jviews-maps-defense89/doc/html/en-US/Content/Visualization/Documentation/JViews/JViews_Defense/_pubskel/ps_usrprgdef811.html
// TODO: Create a SIDC editor.
export function MilSymbolEditor(props: any) {
    const symbol = props.milSymbol
        ? props.milSymbol as ms.Symbol
        : new ms.Symbol('SFGPU-------')
    const soptions = symbol.getOptions()

    const fields: Array<Field> = [
        { title: 'SIDC', option: 'sidc' },
        { title: 'Unique Designation', option: 'uniqueDesignation' },
        { title: 'Higher Formation', option: 'higherFormation' },
        { title: 'Reinforced or Reduced', option: 'reinforcedReduced' },
        { title: 'Type', option: 'type' },
        { title: 'Additional Information', option: 'additionalInformation' }
    ]
    const inputFields = new Array<JSX.Element>()
    for (const field of fields) {
        const fieldRef = useRef<HTMLInputElement>()
        inputFields.push(<span key={field.option + 1}>{field.title}:</span>)
        inputFields.push(
            <input
                key={field.option + 2}
                ref={fieldRef}
                type='text'
                defaultValue={String(soptions[field.option])}
                onChange={() => {
                    (soptions[field.option] as any) = fieldRef.current.value
                    updateSvg()
                }}
            />
        )
    }

    let updateSvgTimeout: any = null
    const [svg, setSvg] = useState(symbol.toDataURL())
    function updateSvg() {
        symbol.setOptions(soptions)
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
                {inputFields}
            </div>
            <div>
                <img src={svg} />
            </div>
        </div>
    )
}