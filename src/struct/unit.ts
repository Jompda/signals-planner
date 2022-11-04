import { UnitOptions } from '../interfaces';
import { Symbol as MilSymbol } from 'milsymbol';


export default class Unit {
    public id: string
    public latlng: L.LatLng
    public symbol: MilSymbol
    constructor(options: UnitOptions) {
        Object.assign(this, options)
    }
}