import { useRef } from 'react'
import { addAction } from '../../actionhistory'
import { AddLinksAction, RemoveLinksAction } from '../../actions/linkactions'
import { generateLinkLayers, generateMatrix } from '../../linkutil'
import { resolveMedium } from '../../struct/medium'
import { getLinkLayersByUnitLayers, getSelectedUnitLayers, getSelectedUnits } from '../structurecontroller'
import { MediumOptions } from './mediumoptions'
import { CableLinkEstimate, RadioLinkEstimate } from '../../interfaces'
import { startDownload } from '../../util'
import { getSetting } from '../../settings'


export function LinkGroupActions() {
    const minDistRef = useRef<HTMLInputElement>()
    const maxDistRef = useRef<HTMLInputElement>()
    const maxDbRef = useRef<HTMLInputElement>()
    const emitterHeightRef = useRef<HTMLInputElement>()

    const nodesOnlyRef = useRef<HTMLInputElement>()
    const overrideRef = useRef<HTMLInputElement>()

    const generateBtnRef = useRef<HTMLButtonElement>()
    const removeBtnRef = useRef<HTMLButtonElement>()


    let mediumName = getSetting('defaultLinkMedium') as string
    let emitterHeight = getSetting('defaultEmitterHeight') as string

    function prepGenerateLinks() {
        generateBtnRef.current.disabled = true
        removeBtnRef.current.disabled = true

        const medium = resolveMedium(mediumName)
        let unitLayers = getSelectedUnitLayers()
        if (nodesOnlyRef.current.checked) unitLayers = unitLayers.filter(
            unitLayer => unitLayer.unit.symbol.getOptions().higherFormation == 'Node'
        )

        const minDist = parseFloat(minDistRef.current.value) * 1000
        const maxDist = parseFloat(maxDistRef.current.value) * 1000
        const maxDb = parseFloat(maxDbRef.current.value)

        generateLinkLayers(
            unitLayers,
            minDist,
            maxDist,
            maxDb,
            medium,
            parseFloat(emitterHeightRef.current.value),
            overrideRef.current.checked,
            function progress(i) {
                generateBtnRef.current.textContent = `Progress: ${Math.round(i * 100)}%.`
            },
            function done(linkLayers) {
                addAction(new AddLinksAction(linkLayers))
                generateBtnRef.current.textContent = 'Generate links between selected units'
                generateBtnRef.current.disabled = false
                removeBtnRef.current.disabled = false
            }
        )
    }

    function removeLinks() {
        const unitLayers = getSelectedUnitLayers()
        const linkLayers = getLinkLayersByUnitLayers(unitLayers)
        addAction(new RemoveLinksAction(linkLayers).forward())
    }

    // TODO: change minDb default
    // TODO: Add these hard coded default values to settings
    return (
        <>
            <h2>Group Actions</h2>
            <span>Link Medium:</span>
            <MediumOptions
                sourceOnly={true}
                defaultMedium={mediumName}
                updateMedium={(value: string) => mediumName = value}
                updateEmitterHeight0={() => null} // NOTE: temp, can't be like this
                updateEmitterHeight1={() => null}
            />
            <div className='ma-2xgrid'>
                <span>Min distance (km):</span>
                <input ref={minDistRef} type='number' defaultValue='3' />
                <span>Max distance (km):</span>
                <input ref={maxDistRef} type='number' defaultValue='20' />
                <span>Max dB loss:</span>
                <input ref={maxDbRef} type='number' defaultValue='130' />
                <span>Emitter height (m):</span>
                <input ref={emitterHeightRef} type='number' defaultValue={emitterHeight} />
            </div>
            <label>
                <input
                    ref={nodesOnlyRef}
                    type='checkbox'
                />
                Nodes only
            </label>
            <label>
                <input
                    ref={overrideRef}
                    type='checkbox'
                />
                Override links
            </label>

            <br />
            <button
                ref={generateBtnRef}
                onClick={prepGenerateLinks}
            >Generate links between selected units</button>
            <br />
            <button
                ref={removeBtnRef}
                onClick={removeLinks}
            >Remove selected links</button>
            <br />
            <button
                onClick={() => {
                    const links = getLinkLayersByUnitLayers(getSelectedUnitLayers()).map(linkLayer => linkLayer.link)
                    const matrix = generateMatrix(getSelectedUnits(), links, (link) => String(Math.round((link.stats as RadioLinkEstimate).A__db) || ''))
                    const csvStr = matrix.map(line => line.join(',')).join('\n')
                    startDownload('matrix_' + new Date().toISOString() + '.csv', 'text/csv', csvStr)
                }}
            >Export radio link matrix</button>
            <button
                onClick={() => {
                    const links = getLinkLayersByUnitLayers(getSelectedUnitLayers()).map(linkLayer => linkLayer.link)
                    const matrix = generateMatrix(getSelectedUnits(), links, (link) => String(Math.round((link.stats as CableLinkEstimate).length) || ''))
                    const csvStr = matrix.map(line => line.join(',')).join('\n')
                    startDownload('matrix_' + new Date().toISOString() + '.csv', 'text/csv', csvStr)
                }}
            >Export cable link matrix</button>
        </>
    )
}