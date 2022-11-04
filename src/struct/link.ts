import { LinkOptions } from '../interfaces';
import Unit from './unit';


export default class Link {
    public id: string
    public unit0: Unit
    public unit1: Unit
    constructor(options: LinkOptions) {
        Object.assign(this, options)
    }
}