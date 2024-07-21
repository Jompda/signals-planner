import Tool from '../tool'
import { DomUtil, LeafletKeyboardEvent, LeafletMouseEvent, polyline, Polyline } from 'leaflet'
import UnitLayer from '../components/unitlayer'
import { Medium, resolveMedium } from '../../struct/medium'
import { addAction } from '../../actionhistory'
import { AddLinkAction } from '../../actions/linkactions'
import LinkLayer from '../components/linklayer'
import Link from '../../struct/link'
import { getMap } from '../structurecontroller'
import { LeafletDialog } from '../../interfaces'
import { createDialog } from '../../util'
import { createRoot } from 'react-dom/client'
import { MediumSelector } from '../components/mediumselector'


class LinkEditorTool extends Tool {
    private medium: Medium
    private startUnit: UnitLayer
    private highlight: Polyline
    public editDialog: LeafletDialog
    constructor() {
        super({
            name: 'linkeditor',
            tooltip: 'Link Editor',
            icon: <i className='fa fa-pen' />,
            items: [{
                name: 'linkeditoredit',
                icon: 'Edit',
                radio: false,
                addHooks: () => {
                    if (!this.editDialog) this.createEditMenu()
                    this.editDialog.open()
                },
            }],
            unitDragging: false,
            mmbInfo: true
        })
        this.medium = resolveMedium('SHF1')
    }
    unitlayermousedown(e: LeafletMouseEvent, unitLayer: UnitLayer) {
        this.startUnit = unitLayer
        this.highlight = polyline([unitLayer.getLatLng()], {
            color: 'black',
            opacity: 0.75
        }).addTo(getMap())
    }
    mousemove(e: LeafletMouseEvent) {
        if (!this.highlight) return
        this.highlight.setLatLngs([
            this.startUnit.getLatLng(),
            e.latlng
        ])
    }
    mouseup(e: LeafletMouseEvent) {
        if (!this.highlight) return
        this.highlight.remove()
        this.highlight = undefined
        this.startUnit = undefined
    }
    // Is called before mouseup
    unitlayermouseup(e: LeafletMouseEvent, unitLayer: UnitLayer) {
        if (!this.startUnit) return
        if (this.startUnit.unit.id == unitLayer.unit.id) return
        this.highlight.remove()
        this.highlight = undefined
        const link = new Link({
            unit0: this.startUnit.unit,
            unit1: unitLayer.unit,
            emitterHeight0: 25, // TODO: Add ability to change emitterHeight values
            emitterHeight1: 25,
            medium: this.medium,
        })
        addAction(new AddLinkAction(new LinkLayer(
            link,
            this.startUnit,
            unitLayer
        )).forward())
        this.startUnit = undefined
    }

    keydown(e: LeafletKeyboardEvent) {
        if (e.originalEvent.key == 'Control')
            getMap().dragging.disable()
    }
    keyup(e: LeafletKeyboardEvent) {
        if (e.originalEvent.key == 'Control')
            getMap().dragging.enable()
    }

    createEditMenu() {
        this.editDialog = createDialog(getMap(), {
            size: [300, 150],
            maxSize: [400, 300],
            minSize: [300, 100],
            anchor: [innerHeight / 2 - 300, innerWidth / 2 - 300],
            position: 'topleft',
            destroyOnClose: false
        })

        const container = DomUtil.create('div', 'dialog-menu')
        this.editDialog.setContent(container)
        createRoot(container).render(
            <>
                <h2>Link type:</h2>
                <MediumSelector
                    defaultValue={this.medium.name}
                    updateMedium={(mediumName: string) => this.medium = resolveMedium(mediumName)}
                />
            </>
        )
    }
}
export default new LinkEditorTool()