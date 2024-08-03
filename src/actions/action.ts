import { ActionEvent, actionEvents } from "../actionhistory"

export default abstract class Action {
    public added = false
    private _preventEventDispatch = false
    preventEventDispatch(state = true) {
        this._preventEventDispatch = state
        return this
    }
    dispatchEvent(event: ActionEvent) {
        if (!this._preventEventDispatch) actionEvents.dispatchEvent(new Event(event))
    }
    abstract forward(): this
    abstract reverse(): this
}