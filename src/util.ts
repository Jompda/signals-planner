import * as L from 'leaflet'


export function startDownload(name: string, type: string, content: string) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type }))
    a.download = name
    a.click()
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


export function createMapboxTerrainAttribution(layername: string) {
    return layername +
        '<a href=\"https://www.mapbox.com/about/maps/\" target=\"_blank\" title=\"Mapbox\" aria-label=\"Mapbox\">&copy; Mapbox</a> ' +
        '<a href=\"https://www.mapbox.com/contribute/\" target=\"_blank\" title=\"Improve this map\" aria-label=\"Improve this map\">Improve this map</a>'
}


/**
 * https://github.com/Leaflet/Leaflet/issues/5442
 * By Piero Steinger, extended for markers by Joni Rapo.
 */
(L.Layer as any).prototype.setInteractive = function (state: boolean) {
    if (this.getLayers) {
        this.getLayers().forEach((layer: any) => {
            layer.setInteractive(state)
        })
        return
    }

    this.options.interactive = state

    const el = this._path || this._icon

    if (state) {
        L.DomUtil.addClass(el, 'leaflet-interactive')
    } else {
        L.DomUtil.removeClass(el, 'leaflet-interactive')
    }
}