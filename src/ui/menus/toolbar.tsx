import { createRoot } from 'react-dom/client'
import { Map as LMap, Control, control, Util, DomUtil, DomEvent } from 'leaflet'
import Tool from '../tool';
import { useRef, useState } from 'react';
import { setActiveTool } from '../toolcontroller';


(control as any).toolbar = function (options: any) {
    return new (Control as any).Toolbar(options)
};

(Control as any).Toolbar = Control.extend({
    options: {
        position: 'topleft'
    },

    initialize: function (tools: Array<Tool>, options: any) {
        Util.setOptions(this, options)

        const container = this._container = DomUtil.create('div', 'toolbar')

        const toolbuttons = new Array<JSX.Element>()
        for (let i = 0; i < tools.length; i++) {
            toolbuttons.push(
                <ToolButton
                    key={i}
                    defaultChecked={!Boolean(i)}
                    callback={() => {
                        console.log(i, tools[i])
                        setActiveTool(tools[i])
                    }}
                    tool={tools[i]}
                />
            )
        }

        const root = createRoot(container)
        root.render(
            <>
                {toolbuttons}
            </>
        )
    },

    onAdd: function (map: LMap) {
        this._map = map
        DomEvent.disableClickPropagation(this._container)
        DomEvent.disableScrollPropagation(this._container)
        return this._container
    },
})


function ToolButton(props: any) {
    return (
        <label className='toolbutton'>
            <input
                type='radio'
                id={props.tool.icon}
                defaultChecked={props.defaultChecked}
                name='toolbartool'
                onChange={() => {
                    props.callback()
                }}
            />
            <div className='toolbutton-icon'>{props.tool.icon}</div>
        </label>
    )
}