import { SymbolOptions, Symbol as MilSymbol } from 'milsymbol'
import { useRef, useState } from 'react'


interface Field {
    title: string
    option: keyof SymbolOptions
}

// SIDC layout:
// 0. Overall symbology: (S)GWIMO
// 1. Affiliation: PUAFNSHJKO
const affiliations = {
    'PENDING': 'P',
    'UNKNOWN': 'U',
    'ASSUMED FRIEND': 'A',
    'FRIEND': 'F',
    'NEUTRAL': 'N',
    'SUSPECT': 'S',
    'HOSTILE': 'H',
    'JOKER': 'J',
    'FAKER': 'K',
    'NONE SPECIFIED': 'O'
}
// 2. Battle Dimension: PAGSUFX
const battleDimensions = {
    'SPACE': 'P',
    'AIR': 'A',
    'GROUND': 'G',
    'SEA SURFACE': 'S',
    'SEA SUBSURFACE': 'U',
    'SOF': 'F',
    'OTHER': 'X',
}
// 3. Status: AP
const status = {
    'ANTICIPATED/PLANNED': 'A',
    'PRESENT': 'P'
}
// 4-9. Specialization with increasing detail: US----
// 10. Modifier such as HQ: A-H, M-N
const unitSizeModifier = {
    'HQ': 'A',
    'TF HQ': 'B',
    'FD HQ': 'C',
    'FD/TF HQ': 'D',
    'TF': 'E',
    'FD': 'F',
    'FD/TF': 'G',
}
// 11. Unit size: A to M (Team to Region) null is -.
const unitSize = {
    'NULL': '-',
    'TEAM/CREW': 'A',
    'SQUAD': 'B',
    'SECTION': 'C',
    'PLATOON/DETACHMENT': 'D',
    'COMPANY/BATTERY/TROOP': 'E',
    'BATTALION/SQUADRON': 'F',
    'REGIMENT/GROUP': 'G',
    'BRIGADE': 'H',
    'DIVISION': 'I',
    'CORPS/MEF': 'J',
    'ARMY': 'K',
    'ARMY GROUP/FRONT': 'L',
    'REGION': 'M'
}
// 12-13. Associated country code: CA, US etc..
// 14. Order of battle: ACGNS


// SIDC explained
// https://help.perforce.com/visualization/jviews/8.9/jviews-maps-defense89/doc/html/en-US/Content/Visualization/Documentation/JViews/JViews_Defense/_pubskel/ps_usrprgdef811.html
// TODO: Create a SIDC editor. Or just rely on third party editors and take the SIDC? Embed somehow?
export function MilSymbolEditor({ milSymbol, updateMilSymbol }: {
    milSymbol: MilSymbol
    updateMilSymbol: (s: MilSymbol) => any
}) {
    const symbol = milSymbol
        ? milSymbol as MilSymbol
        : new MilSymbol('SFGPU-------')
    const soptions = symbol.getOptions()


    const textFields: Array<Field> = [
        { title: 'SIDC', option: 'sidc' },
        { title: 'Unique Designation', option: 'uniqueDesignation' },
        { title: 'Higher Formation', option: 'higherFormation' },
        { title: 'Reinforced or Reduced', option: 'reinforcedReduced' },
        { title: 'Type', option: 'type' },
        { title: 'Additional Information', option: 'additionalInformation' },
        { title: 'Date Time Group', option: 'dtg' }
    ]
    const inputFields = new Array<React.JSX.Element>()
    for (const field of textFields) {
        const fieldRef = useRef<HTMLInputElement>()
        inputFields.push(<span key={field.option + 1}>{field.title}</span>)
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
        if (updateSvgTimeout) clearTimeout(updateSvgTimeout)
        updateSvgTimeout = setTimeout(() => {
            setSvg(symbol.toDataURL())
            updateMilSymbol(symbol)
            updateSvgTimeout = null
        }, 500)
    }

    updateMilSymbol(symbol)

    return (
        <div>
            <a href="https://spatialillusions.com/unitgenerator/" target="_blank">https://spatialillusions.com/unitgenerator/</a>
            <div className='milsymbol-editor'>
                <div className='milsymbol-editor-fields'>
                    {inputFields}
                    <span>Color</span>
                    <select defaultValue={soptions.colorMode as string}
                        onChange={e => {
                            soptions.colorMode = e.target.value
                            updateSvg()
                    }}>
                        <option>Light</option>
                        <option>Medium</option>
                        <option>Dark</option>
                    </select>
                </div>
                <div>
                    <img src={svg} />
                </div>
            </div>  
        </div>
    )
}