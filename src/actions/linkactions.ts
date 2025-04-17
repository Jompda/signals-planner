import LinkLayer from '../ui/components/linklayer'
import Action from './action'
import { addLink as structAddLink, removeLink as structRemoveLink } from '../struct'
import { addLink as lgAddLink, removeLink as lgRemoveLink } from '../ui/structurecontroller'
import { MediumResolvable } from '../interfaces'
import { sealedArray } from '../util'


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
        this.dispatchEvent('structureUpdate')
        return this
    }
    reverse() {
        this.linkLayer.removeHandlers()
        structRemoveLink(this.linkLayer.link)
        lgRemoveLink(this.linkLayer)
        this.dispatchEvent('structureUpdate')
        return this
    }
}


export class RemoveLinkAction extends LinkAction {
    forward() {
        this.linkLayer.removeHandlers()
        structRemoveLink(this.linkLayer.link)
        lgRemoveLink(this.linkLayer)
        this.dispatchEvent('structureUpdate')
        return this
    }
    reverse() {
        structAddLink(this.linkLayer.link)
        lgAddLink(this.linkLayer)
        this.linkLayer.addHandlers()
        this.dispatchEvent('structureUpdate')
        return this
    }
}


export class EditLinkAction extends LinkAction {
    private medium = sealedArray<MediumResolvable>(2)
    private emitterHeightOld = sealedArray<number>(2)
    private emitterHeightNew = sealedArray<number>(2)
    constructor(
        linkLayer: LinkLayer,
        medium0: MediumResolvable,
        emitterHeightOld0: number,
        emitterHeightOld1: number,
        medium1: MediumResolvable,
        emitterHeightNew0: number,
        emitterHeightNew1: number,
    ) {
        super(linkLayer)
        this.medium[0] = medium0
        this.medium[1] = medium1
        this.emitterHeightOld[0] = emitterHeightOld0;
        this.emitterHeightOld[1] = emitterHeightOld1;
        this.emitterHeightNew[0] = emitterHeightNew0;
        this.emitterHeightNew[1] = emitterHeightNew1;
    }
    forward() {
        this.linkLayer.link.setMedium(this.medium[1])
        this.linkLayer.link.emitterHeight = this.emitterHeightNew
        this.linkLayer.update().then(() => this.dispatchEvent('structureUpdate'))
        return this
    }
    reverse() {
        this.linkLayer.link.setMedium(this.medium[0])
        this.linkLayer.link.emitterHeight = this.emitterHeightOld
        this.linkLayer.update().then(() => this.dispatchEvent('structureUpdate'))
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
        this.dispatchEvent('structureUpdate')
        return this
    }
    reverse() {
        for (const linkLayer of this.linkLayers) {
            linkLayer.removeHandlers()
            lgRemoveLink(linkLayer)
            structRemoveLink(linkLayer.link)
        }
        this.dispatchEvent('structureUpdate')
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
        this.dispatchEvent('structureUpdate')
        return this
    }
    reverse() {
        for (const linkLayer of this.linkLayers) {
            structAddLink(linkLayer.link)
            lgAddLink(linkLayer)
            linkLayer.addHandlers()
        }
        this.dispatchEvent('structureUpdate')
        return this
    }
}