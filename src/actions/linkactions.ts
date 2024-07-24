import LinkLayer from '../ui/components/linklayer'
import Action from './action'
import { addLink as structAddLink, removeLink as structRemoveLink } from '../struct'
import { addLink as lgAddLink, removeLink as lgRemoveLink } from '../ui/structurecontroller'
import { MediumResolvable } from '../interfaces'


abstract class LinkAction extends Action {
    public linkLayer: LinkLayer
    constructor(linkLayer: LinkLayer) {
        super()
        this.linkLayer = linkLayer
    }
}


export class AddLinkAction extends LinkAction {
    forward() {
        structAddLink(this.linkLayer.link)
        lgAddLink(this.linkLayer)
        this.linkLayer.addHandlers()
        return this
    }
    reverse() {
        this.linkLayer.removeHandlers()
        structRemoveLink(this.linkLayer.link)
        lgRemoveLink(this.linkLayer)
        return this
    }
}


export class RemoveLinkAction extends LinkAction {
    forward() {
        this.linkLayer.removeHandlers()
        structRemoveLink(this.linkLayer.link)
        lgRemoveLink(this.linkLayer)
        return this
    }
    reverse() {
        structAddLink(this.linkLayer.link)
        lgAddLink(this.linkLayer)
        this.linkLayer.addHandlers()
        return this
    }
}


export class EditLinkAction extends LinkAction {
    private medium0: MediumResolvable
    private medium1: MediumResolvable
    private emitterheight00: number
    private emitterheight10: number
    private emitterheight01: number
    private emitterheight11: number
    constructor(linkLayer: LinkLayer,
        medium0: MediumResolvable,
        emitterheight00: number,
        emitterheight10: number,
        medium1: MediumResolvable,
        emitterheight01: number,
        emitterheight11: number,
    ) {
        super(linkLayer)
        this.medium0 = medium0
        this.medium1 = medium1
        this.emitterheight00 = emitterheight00;
        this.emitterheight01 = emitterheight01;
        this.emitterheight10 = emitterheight10;
        this.emitterheight11 = emitterheight11;
    }
    forward() {
        this.linkLayer.link.setMedium(this.medium1)
        this.linkLayer.link.emitterHeight0 = this.emitterheight01
        this.linkLayer.link.emitterHeight1 = this.emitterheight11
        this.linkLayer.update()
        return this
    }
    reverse() {
        this.linkLayer.link.setMedium(this.medium0)
        this.linkLayer.link.emitterHeight0 = this.emitterheight00
        this.linkLayer.link.emitterHeight1 = this.emitterheight10
        this.linkLayer.update()
        return this
    }
}


export class AddLinksAction extends Action {
    private linkLayers: Array<LinkLayer>
    constructor(linkLayers: Array<LinkLayer>) {
        super()
        this.linkLayers = linkLayers
    }
    forward() {
        for (const linkLayer of this.linkLayers) {
            structAddLink(linkLayer.link)
            lgAddLink(linkLayer)
            linkLayer.addHandlers()
        }
        return this
    }
    reverse() {
        for (const linkLayer of this.linkLayers) {
            linkLayer.removeHandlers()
            lgRemoveLink(linkLayer)
            structRemoveLink(linkLayer.link)
        }
        return this
    }
}


export class RemoveLinksAction extends Action {
    private linkLayers: Array<LinkLayer>
    constructor(linkLayers: Array<LinkLayer>) {
        super()
        this.linkLayers = linkLayers
    }
    forward() {
        for (const linkLayer of this.linkLayers) {
            linkLayer.removeHandlers()
            lgRemoveLink(linkLayer)
            structRemoveLink(linkLayer.link)
        }
        return this
    }
    reverse() {
        for (const linkLayer of this.linkLayers) {
            structAddLink(linkLayer.link)
            lgAddLink(linkLayer)
            linkLayer.addHandlers()
        }
        return this
    }
}