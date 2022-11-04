import * as L from 'leaflet'
import { UnitOptions } from '../interfaces'
import { Symbol as MilSymbol } from 'milsymbol'
import { createMarker } from '../ui/components/unitmarker'


export default class Unit {
    public id: string
    public symbol: MilSymbol
    public layer: L.Marker
    constructor(options: UnitOptions) {
        Object.assign(this, options)
        this.layer = createMarker(options.latlng, this)
    }
}