import { CircleMarker, DomEvent, DomUtil, Map as LMap } from 'leaflet'
import { createRoot } from 'react-dom/client'
import { createDialog } from '../../util'
import LinkLayer from '../components/linklayer'
import { LinkStatistics } from '../components/linkstatistics'


let closeActive: Function


export function showLinkStatistics(map: LMap, linkLayer: LinkLayer) {
    const anchor = closeActive ? closeActive() : { x: 0, y: innerHeight / 2 - 350 }
    const dialog = createDialog(map, {
        size: [600, 520],
        maxSize: [600, 700],
        minSize: [600, 400],
        anchor: [anchor.y, anchor.x],
        position: 'topleft',
        initOpen: true,
        onClose: onDialogClose
    })
    const closer = closeActive = () => {
        dialog.close()
        return {
            x: parseFloat(dialog._container.style.left),
            y: parseFloat(dialog._container.style.top)
        }
    }

    const highlight = new CircleMarker(linkLayer.link.unit0.latlng, { radius: 10 }).addTo(map)

    const container = DomUtil.create('div', 'dialog-menu')
    DomEvent.disableClickPropagation(container)
    DomEvent.disableScrollPropagation(container)
    dialog.setContent(container)
    let root = createUI(container)

    linkLayer.on('update', onLinkUpdate)
    linkLayer.on('remove', onLinkRemove)

    function onLinkUpdate() {
        root.unmount()
        root = createUI(container)
        highlight.setLatLng(linkLayer.link.unit0.latlng)
    }
    function onLinkRemove() {
        dialog.close()
    }
    function onDialogClose() {
        linkLayer.off('update', onLinkUpdate)
        linkLayer.off('remove', onLinkRemove)
        highlight.remove()
        if (closeActive == closer) closeActive = undefined
    }


    function createUI(container: HTMLDivElement) {
        const root = createRoot(container)

        root.render(
            <>
                <h3>{
                    'Link: ' +
                    linkLayer.link.unit0.toHierarchyString() +
                    ' --- ' +
                    linkLayer.link.unit1.toHierarchyString()
                }</h3>
                <LinkStatistics
                    linkLayer={linkLayer}
                    setHighlightLatLng={(latlng: LatLng) =>
                        highlight.setLatLng(latlng)
                    }
                />
            </>
        )

        return root
    }
}