import LinkLayer from '../ui/components/linklayer'
import Action from './action'
import { addLink as structAddLink, removeLink as structRemoveLink } from '../struct'
import { addLink as lgAddLink, removeLink as lgRemoveLink } from '../ui/structurecontroller'


abstract class LinkAction extends Action {
    protected linkLayer: LinkLayer
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
    forward() {
        // TODO: After adding mediums implement EditLinkAction.
        console.log('implement')
        return this
    }
    reverse() {
        console.log('implement')
        return this
    }
}