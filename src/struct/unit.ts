import * as L from 'leaflet'
import { UnitOptions } from '../interfaces'
import { Symbol as MilSymbol } from 'milsymbol'
import { createMarker, updateMarker } from '../ui/components/unitmarker'


export default class Unit {
    public id: string
    public symbol: MilSymbol
    public layer: L.Marker
    constructor(options: UnitOptions) {
        Object.assign(this, options)
        this.layer = createMarker(options.latlng, this)
    }
    updateMarker(latlng: L.LatLng, symbol: MilSymbol) {
        this.symbol = symbol
        this.layer.setLatLng(latlng)
        updateMarker(this.layer, symbol)
        this.layer.fireEvent('update')
    }
}