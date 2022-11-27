import { createDialog } from "../../util"
import { DomEvent, DomUtil, Map as LMap } from 'leaflet'
import { createRoot } from 'react-dom/client'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'


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
                        <Tab>Tab 1</Tab>
                        <Tab>Tab 2</Tab>
                    </TabList>
                    <TabPanel>
                        <h2>testp1</h2>
                    </TabPanel>
                    <TabPanel>
                        <h2>testp2</h2>
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
