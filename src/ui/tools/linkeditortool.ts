import Tool from '../tool'
import { LeafletKeyboardEvent, LeafletMouseEvent, polyline, Polyline } from 'leaflet'
import unitlayer from '../components/unitlayer'
import UnitLayer from '../components/unitlayer'
import { Medium, resolveMedium } from '../../struct/medium'
import { addAction } from '../../actionhistory'
import { AddLinkAction } from '../../actions/linkactions'
import LinkLayer from '../components/linklayer'
import Link from '../../struct/link'
import { getMap } from '../structurecontroller'


class LinkEditorTool extends Tool {
    private medium: Medium
    private startUnit: UnitLayer
    private highlight: Polyline
    constructor() {
        super({
            icon: {
                tooltip: 'Link Editor',
                html: `<div class="center-content"><img src="./assets/linkeditor.png"/></div>`
            },
            actions: [{
                html: 'Change medium' // TODO: Ability to change the drawn medium.
            }],
            unitDragging: false,
            mmbTopography: true
        })
        this.medium = resolveMedium('SHF1')
    }
    middlemouseclick(e: LeafletMouseEvent) {
    }
    unitlayermousedown(e: LeafletMouseEvent, unitLayer: unitlayer) {
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
    unitlayermouseup(e: LeafletMouseEvent, unitLayer: unitlayer) {
        if (!this.startUnit) return
        if (this.startUnit.unit.id == unitLayer.unit.id) return
        console.log('unitlayermouseup')
        this.highlight.remove()
        this.highlight = undefined
        const link = new Link({
            medium: this.medium,
            unit0: this.startUnit.unit,
            unit1: unitLayer.unit
        })
        addAction(new AddLinkAction(new LinkLayer(
            link,
            this.startUnit,
            unitLayer
        )).forward())
        this.startUnit = undefined
    }

    keydown(e: LeafletKeyboardEvent): void {
        if (e.originalEvent.key == 'Control')
            getMap().dragging.disable()
    }
    keyup(e: LeafletKeyboardEvent): void {
        if (e.originalEvent.key == 'Control')
            getMap().dragging.enable()
    }
}
export default new LinkEditorTool()