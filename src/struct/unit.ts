import { LatLng, latLng } from 'leaflet'
import { SaveUnit, UnitOptions } from '../interfaces'
import { Symbol as MilSymbol } from 'milsymbol'
import { filterEmpty } from '../util'


export default class Unit {
    public id: string
    public latlng: LatLng
    public symbol: MilSymbol
    constructor(options: UnitOptions) {
        Object.assign(this, options)
    }
    setLatLng(latlng: LatLng) {
        this.latlng = latlng
    }
    setSymbol(symbol: MilSymbol) {
        this.symbol = symbol
    }


    serialize() {
        return {
            id: this.id,
            latlng: this.latlng,
            symbolOptions: filterEmpty(this.symbol.getOptions(false))
        } as SaveUnit
    }
    static deserialize(obj: SaveUnit) {
        return new Unit({
            id: obj.id,
            latlng: latLng(obj.latlng),
            symbol: new MilSymbol(obj.symbolOptions)
        })
    }
}