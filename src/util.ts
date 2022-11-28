import { Map as LMap, Layer, DomUtil, control, Polyline, Polygon, Circle, Marker, geoJSON } from 'leaflet'
import { Symbol as MilSymbol } from 'milsymbol'
import { v4 as uuidv4 } from 'uuid'


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
        else if ((layer.options as any).textMarker)
            json.properties.text = (layer.options as any).text
        return json
    })
}
export function geoJsonToLayers(geojson: Array<any>, styleOptions: any) {
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


export function requestFileUpload(accept: string, callback: (content: string) => any) {
    const fileInput = DomUtil.create('input')
    fileInput.setAttribute('type', 'file')
    fileInput.setAttribute('accept', accept)
    //fileInput.setAttribute('multiple', '')

    fileInput.onchange = () => {
        const file = fileInput.files[0]
        if (!file) return alert('Select a file to load!')
        console.log(`Reading "${file.name}" ..`)
        const reader = new FileReader()
        reader.onload = function (e) {
            //console.log(e.target.result)
            callback(e.target.result.toString())
        }
        reader.readAsText(file)
    }

    fileInput.click()
}


export function round(value: number, decimal = 2) {
    const m = Math.pow(10, decimal)
    return Math.round(value * m) / m
}


export function filterEmpty(obj: any) {
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
        this.getLayers().forEach((layer: any) => {
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
        this.getLayers().forEach((layer: any) => {
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

export function symbolToHierarchyString(symbol: MilSymbol, undef?: string) {
    const options = symbol.getOptions(false)
    const hierarchy = new Array<String>()
    const unitSize = options.sidc.charCodeAt(options.sidc.length - 1) - 65

    function add(specifier: string, i: number) {
        hierarchy.push(
            (specifier ? specifier + '.' : '')
            + (unitSize >= 0 ? unitNames[i].short : '')
        )
    }

    add(options.uniqueDesignation || `(id:${undef})`, unitSize)
    if (options.higherFormation.length > 0) {
        const split = options.higherFormation.split('/')
        for (let i = 0; i < split.length; i++)
            add(split[i], unitSize + 1 + i)
    }

    return hierarchy.reverse().join(' | ')
}


export function createDialog(map: LMap, options: any) {
    const dialog = (control as any).dialog(options).addTo(map)
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

    return dialog
}