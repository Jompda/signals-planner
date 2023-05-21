import { LatLng, latLng } from 'leaflet'
import { SaveUnit, UnitOptions } from '../interfaces'
import { Symbol as MilSymbol } from 'milsymbol'
import { filterEmpty, symbolToHierarchyString } from '../util'


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


    toHierarchyString(reverseOrder?: boolean) {
        return symbolToHierarchyString(this.symbol, reverseOrder, this.id)
    }
    unitIdentifier(reverseOrder?: boolean) {
        const hstring = this.toHierarchyString(reverseOrder)
        const opt = this.symbol.getOptions(false)
    
        if (isNaN(parseInt(opt.uniqueDesignation))) return hstring
        if (opt.higherFormation != 'Node') return hstring
        return 'Node ' + opt.uniqueDesignation
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