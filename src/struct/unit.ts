import * as L from 'leaflet'
import { SaveUnit, UnitOptions } from '../interfaces'
import { Symbol as MilSymbol } from 'milsymbol'
import { createMarker } from '../ui/components/unitmarker'
import { filterEmpty } from '../util'


// SFGPUUS----B Signals squad
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
        this.layer.fireEvent('update', { latlng, symbol })
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