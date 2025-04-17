import { createDialog } from '../../util'
import { DomUtil, Map as LMap } from 'leaflet'
import { createRoot } from 'react-dom/client'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import { LinkGroupActions } from '../components/linkgroupactions'


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
    dialog.setContent(container)

    const root = createRoot(container)

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
}