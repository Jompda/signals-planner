import { CircleMarker, DomUtil, Map as LMap } from 'leaflet'
import { createRoot } from 'react-dom/client'
import { createDialog } from '../../util'
import LinkLayer from '../components/linklayer'
import { LinkStatistics } from '../components/linkstatistics'


let closeActive: Function


export function showLinkStatistics(map: LMap, linkLayer: LinkLayer) {
    const height = 600
    const anchor = closeActive ? closeActive() : { x: 50, y: innerHeight - height - 20 }
    const dialog = createDialog(map, {
        size: [600, height],
        maxSize: [600, 800],
        minSize: [600, height],
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

    const highlight = new CircleMarker(linkLayer.link.unit[0].latlng, { radius: 10 }).addTo(map)

    const container = DomUtil.create('div', 'dialog-menu')
    dialog.setContent(container)
    let root = createUI(container)

    linkLayer.on('update', onLinkUpdate)
    linkLayer.on('remove', onLinkRemove)

    function onLinkUpdate() {
        root.unmount()
        root = createUI(container)
        highlight.setLatLng(linkLayer.link.unit[0].latlng)
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
                <h3>
                    Link: <span className='underline'>{linkLayer.link.unit[0].toHierarchyString()}</span>
                    <span> — </span>
                    <span className='underline'>{linkLayer.link.medium.name}</span>
                    <span> — </span>
                    <span className='underline'>{linkLayer.link.unit[1].toHierarchyString()}</span>
                </h3>
                <span>NOTE: Figure doesn't take into account earth curvature nor actual radio propagation path.</span>
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