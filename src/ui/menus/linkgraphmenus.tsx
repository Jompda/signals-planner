import { asyncOperation, createDialog, getMaxWorkers, workers } from "../../util"
import { DomEvent, DomUtil, Map as LMap } from 'leaflet'
import { createRoot } from 'react-dom/client'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import { useRef } from "react"
import { MediumSelector } from "../components/mediumselector"
import { Medium, resolveMedium } from "../../struct/medium"
import { getLinkLayerById, getSelectedUnitLayers, removeLink as lgRemoveLink, addLink as lgAddLink, getLinkLayersByUnitLayers } from "../structurecontroller"
import Link from "../../struct/link"
import LinkLayer from "../components/linklayer"
import { linkIdExists, removeLink as structRemoveLink, addLink as structAddLink } from "../../struct"
import UnitLayer from "../components/unitlayer"
import { addAction } from "../../actionhistory"
import { AddLinksAction, RemoveLinksAction } from "../../actions/linkactions"


export function showLinkGraphToolMenu(map: LMap) {
    const dialog = createDialog(map, {
        size: [400, 400],
        maxSize: [400, 700],
        minSize: [400, 400],
        anchor: [innerHeight / 2 - 350, 0],
        position: 'topleft',
        initOpen: true,
        //onClose: onDialogClose
    })

    const container = DomUtil.create('div', 'dialog-menu')
    DomEvent.disableClickPropagation(container)
    DomEvent.disableScrollPropagation(container)
    dialog.setContent(container)

    let root = createUI(container)


    function createUI(element: HTMLElement) {
        const root = createRoot(element)

        root.render(
            <>
                <Tabs>
                    <TabList>
                        <Tab>Group Actions</Tab>
                        <Tab>Tab 2 Placeholder</Tab>
                    </TabList>
                    <TabPanel>
                        <LinkGroupActions />
                    </TabPanel>
                    <TabPanel>
                        <h2>Placeholder</h2>
                    </TabPanel>
                </Tabs>
                <div className='grower'></div>
                <div className='dialog-menu-submit'>
                    <button onClick={() => {
                        // do things
                        //dialog.close()
                    }}>Place holder</button>
                </div>
            </>
        )

        return root
    }
}


function LinkGroupActions(props: any) {
    const minDistRef = useRef<HTMLInputElement>()
    const maxDistRef = useRef<HTMLInputElement>()
    const mindbRef = useRef<HTMLInputElement>()

    const nodesOnlyRef = useRef<HTMLInputElement>()
    const overrideRef = useRef<HTMLInputElement>()

    const generateBtnRef = useRef<HTMLButtonElement>()
    const removeBtnRef = useRef<HTMLButtonElement>()


    let mediumName = 'SHF1'

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
        const minDB = parseFloat(mindbRef.current.value)

        generateLinks(unitLayers, minDist, maxDist, minDB, medium, overrideRef.current.checked,
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

    return (
        <>
            <h2>Group Actions</h2>
            <span>Link Medium:</span>
            <MediumSelector
                defaultValue={mediumName}
                updateMedium={(value: string) => mediumName = value}
            />
            <div className='ma-2xgrid'>
                <span>Min distance (km):</span>
                <input ref={minDistRef} type='number' defaultValue='3' />
                <span>Max distance (km):</span>
                <input ref={maxDistRef} type='number' defaultValue='20' />
                <span>Min dB:</span>
                <input ref={mindbRef} type='number' defaultValue='-108' />
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
        </>
    )
}


function generateLinks(
    unitLayers: Array<UnitLayer>,
    minDist: number,
    maxDist: number,
    minDB: number,
    medium: Medium,
    override: boolean,
    progressFunction: (i: number) => any,
    done: (linkLayers: Array<LinkLayer>) => any
) {
    const linkLayers = new Array<LinkLayer>()
    for (let i = 0; i < unitLayers.length; i++) {
        for (let j = i + 1; j < unitLayers.length; j++) {
            const [unitLayer0, unitLayer1] = LinkLayer.orderUnitLayers(unitLayers[i], unitLayers[j])
            const dist = unitLayer0.unit.latlng.distanceTo(unitLayer1.unit.latlng)
            if (dist < minDist || dist > maxDist) continue
            const link = new Link({
                unit0: unitLayer0.unit,
                unit1: unitLayer1.unit,
                medium
            })
            if (linkIdExists(link.id)) {
                if (override) {
                    const oldLinkLayer = getLinkLayerById(link.id)
                    structRemoveLink(oldLinkLayer.link)
                    lgRemoveLink(oldLinkLayer)
                } else {
                    continue
                }
            }
            const linkLayer = new LinkLayer(link, unitLayer0, unitLayer1)
            linkLayers.push(linkLayer)
        }
    }

    let current = 0
    const check = asyncOperation(
        linkLayers.length,
        () => progressFunction(++current / linkLayers.length),
        () => done(linkLayers)
    )

    workers(linkLayers, async (linkLayer: LinkLayer) => {
        await linkLayer.update()
        if (linkLayer.link.stats.dB < minDB) return check()
        structAddLink(linkLayer.link)
        lgAddLink(linkLayer)
        check()
    }, getMaxWorkers())
}