import { Map as LMap, Layer, DomUtil, control, Polyline, Polygon, Circle, Marker, geoJSON, PolylineOptions, DomEvent } from 'leaflet'
import { Symbol as MilSymbol } from 'milsymbol'
import { v4 as uuidv4 } from 'uuid'
import { LeafletDialogOptions } from './interfaces'


let maxWorkers = 30
export function getMaxWorkers() {
    return maxWorkers
}
export function setMaxWorkers(amount: number) {
    maxWorkers = amount
}


export function layersToGeoJson(layers: Array<Layer>) {
    return (layers as Array<Polyline | Polygon | Circle | Marker>).map(layer => {
        const json = layer.toGeoJSON()
        if (layer instanceof Circle)
            json.properties.radius = layer.getRadius()
        else if (layer instanceof Marker && layer.options.textMarker)
            json.properties.text = layer.options.text
        return json
    })
}
export function geoJsonToLayers(geojson: Array<any>, styleOptions: PolylineOptions) {
    const layers = new Array<Layer>()
    geoJSON(geojson, {
        style: styleOptions,
        pointToLayer: (feature, latlng) => {
            if (feature.properties.radius)
                return new Circle(latlng, feature.properties.radius)
            else if (feature.properties.text)
                return new Marker(latlng, {
                    textMarker: true,
                    text: feature.properties.text
                })
            return new Marker(latlng)
        },
        onEachFeature: (feature, layer) => layers.push(layer)
    })
    return layers
}


export function startDownload(name: string, type: string, content: string) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type }))
    a.download = name
    a.click()
}


export function requestFileUpload(accept: string, callback: (filename: string, content: string) => any) {
    const fileInput = DomUtil.create('input')
    fileInput.setAttribute('type', 'file')
    fileInput.setAttribute('accept', accept)
    //fileInput.setAttribute('multiple', '')

    fileInput.onchange = () => {
        const file = fileInput.files[0]
        if (!file) return alert('Select a file to load!')
        const reader = new FileReader()
        reader.onload = function (e) {
            //console.log(e.target.result)
            callback(file.name, e.target.result.toString())
        }
        reader.readAsText(file)
    }

    fileInput.click()
}


export function round(value: number, decimal = 2) {
    const m = Math.pow(10, decimal)
    return Math.round(value * m) / m
}


export function filterEmpty(obj: Record<any, any>) {
    for (const i in obj)
        if (!obj[i]) obj[i] = undefined
    return obj
}


export function createMapboxTerrainAttribution() {
    return (
        '<a href=\"https://www.mapbox.com/about/maps/\" target=\"_blank\" title=\"Mapbox\" aria-label=\"Mapbox\">&copy; Mapbox</a> ' +
        '<a href=\"https://www.mapbox.com/contribute/\" target=\"_blank\" title=\"Improve this map\" aria-label=\"Improve this map\">Improve this map</a>'
    )
}


/**
 * https://github.com/Leaflet/Leaflet/issues/5442
 * By Piero Steinger, extended for markers by Joni Rapo.
 */
(Layer as any).prototype.setInteractive = function (state: boolean) {
    if (this.getLayers) {
        this.getLayers().forEach((layer: Layer) => {
            layer.setInteractive(state)
        })
        return
    }

    this.options.interactive = state

    const el = this._path || this._icon

    if (state) {
        DomUtil.addClass(el, 'leaflet-interactive')
    } else {
        DomUtil.removeClass(el, 'leaflet-interactive')
    }
};


(Layer as any).prototype.setDraggable = function (state: boolean) {
    if (this.getLayers) {
        this.getLayers().forEach((layer: Layer) => {
            layer.setDraggable(state)
        })
        return
    }

    this.options.draggable = state

    if (state) {
        this.dragging.addHooks()
        DomUtil.addClass(this._icon, 'leaflet-marker-draggable')
    } else {
        this.dragging.removeHooks()
        DomUtil.removeClass(this._icon, 'leaflet-marker-draggable')
    }
}


export function asyncOperation(calls: number, step = (i: number) => { }, done = () => { }) {
    let called = 0
    return () => {
        step(++called / calls)
        if (called === calls) done()
        else if (called > calls) throw new Error('Received too many calls.')
    }
}


export function workers<T>(srcValues: Array<T>, worker: (value: T) => Promise<void>, maxWorkers: number) {
    let working = 0, workingIndex = -1
    function addWorker() {
        if (!(working < maxWorkers && workingIndex < srcValues.length - 1)) return
        ++working
        worker(srcValues[++workingIndex]).then(onFinish)
    }
    function onFinish() {
        --working
        addWorker()
    }
    for (let i = 0; i < maxWorkers && i < srcValues.length; i++) {
        addWorker()
    }
}


export const unitNames = [
    { name: 'Team', short: 'Team.' },
    { name: 'Squad', short: 'Sqd.' },
    { name: 'Section', short: 'Sect.' },
    { name: 'Platoon', short: 'Plt.' },
    { name: 'Company', short: 'Coy.' },
    { name: 'Battalion', short: 'Btl.' },
    { name: 'Regiment', short: 'Rgt.' },
    { name: 'Brigade', short: 'Brg.' },
    { name: 'Division', short: 'Div.' },
    { name: 'Corps', short: 'Corps.' },
    { name: 'Army', short: 'Army.' },
    { name: 'Army Group', short: 'Ag.' },
    { name: 'Region', short: 'Reg.' },
    { name: 'Command', short: 'Cmd.' },
]


/**
 * Exception if symbol satisfies criteria for a default node unit.
 */
export function symbolToHierarchyString(symbol: MilSymbol, reverseOrder?: boolean, undef?: string) {
    const options = symbol.getOptions(false)
    let hierarchy = new Array<String>()
    const unitSize = options.sidc.charCodeAt(options.sidc.length - 1) - 65

    const parts = options.higherFormation.split('/')
    const parsedId = parseInt(options.uniqueDesignation)

    let i = 0
    // Default node criteria
    if (!isNaN(parsedId) && parts.length > 0 && parts[0] === 'Node') {
        hierarchy.push(options.uniqueDesignation + ' Node')
        parts.shift()
    }
    else {
        add(options.uniqueDesignation || `(id:${undef})`, unitSize)
    }

    for (; i < parts.length; ++i)
        if (parts[i].length > 0)
            add(parts[i], unitSize + 1 + i)

    function add(specifier: string, i: number) {
        hierarchy.push(
            (specifier ? specifier.trim() + '.' : '')
            + (unitSize >= 0 ? unitNames[i].short : '')
        )
    }
    if (reverseOrder) hierarchy = hierarchy.reverse()
    return hierarchy.join(' | ')
}


export function createDialog(map: LMap, options: LeafletDialogOptions) {
    const dialog = control.dialog(options).addTo(map)
    DomEvent.disableClickPropagation(dialog._container)
    DomEvent.disableScrollPropagation(dialog._container)
    dialog.identifier = uuidv4()
    map.on('dialog:closed', onDialogClose)

    function onDialogClose(element: any) {
        if (element.identifier != dialog.identifier) return
        if (options.onClose) options.onClose(element)
        if (options.destroyOnClose !== false) {
            map.off('dialog:closed', onDialogClose)
            dialog.destroy()
        }
    }

    function eventFilter(e: KeyboardEvent) {
        e.stopPropagation();
    }

    ((dialog as any)._contentNode as HTMLElement).onkeydown = eventFilter;
    ((dialog as any)._contentNode as HTMLElement).onkeyup = eventFilter;

    return dialog
}


/**
* Bresenham's line algorithm
* Author: Jack Elton Bresenham
* Date: 22.10.2022
* Source: https://en.wikipedia.org/wiki/Bresenham's_line_algorithm
* Modified for context by Joni Rapo 18.7.2024
*/
export function getLinePlot(x0: number, y0: number, x1: number, y1: number) {
    const gridPoints = new Array<{x: number, y: number}>()

    const dx = Math.abs(x1 - x0)
    const sx = x0 < x1 ? 1 : -1
    const dy = -Math.abs(y1 - y0)
    const sy = y0 < y1 ? 1 : -1
    let error = dx + dy

    while (true) {
        gridPoints.push({ x: x0, y: y0 })
        if (x0 == x1 && y0 == y1) break
        const e2 = 2 * error
        if (e2 >= dy) {
            if (x0 == x1) break
            error = error + dy
            x0 = x0 + sx
        }
        if (e2 <= dx) {
            if (y0 == y1) break
            error = error + dx
            y0 = y0 + sy
        }
    }

    return gridPoints
}


/**
 * Creates an array which's size in immutable but the values themselves can be changed.
 */
export function sealedArray<T>(length: number) {
    return Object.seal(new Array<T>(length).fill(undefined))
}
