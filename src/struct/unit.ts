import * as L from 'leaflet'
import { SaveUnit, UnitOptions } from '../interfaces'
import { Symbol as MilSymbol } from 'milsymbol'
import { createMarker, updateMarker } from '../ui/components/unitmarker'
import { filterEmpty } from '../util'


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


    serialize() {
        return {
            id: this.id,
            latlng: this.layer.getLatLng(),
            symbolOptions: filterEmpty(this.symbol.getOptions(false))
        } as SaveUnit
    }
    static deserialize(obj: SaveUnit) {
        return new Unit({
            id: obj.id,
            latlng: L.latLng(obj.latlng),
            symbol: new MilSymbol(obj.symbolOptions)
        })
    }
}