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


    serialize() {
        return {
            id: this.id,
            latlng: this.layer.getLatLng(),
            symbolOptions: this.symbol.getOptions()
        }
    }
    static deserialize(obj: any) {
        return new Unit({
            id: obj.id,
            latlng: obj.latlng,
            symbol: new MilSymbol(obj.symbolOptions)
        })
    }
}