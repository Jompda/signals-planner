import { notifications } from '.'
import Action from './actions/action'
import { getSetting } from './settings'


// TODO: Make modifiable
let actionHistoryLength = getSetting('defaultActionHistoryLength') as number


export type ActionEvent = 'structureUpdate' | 'drawUpdate' | 'selectionUpdate'
/** Event is one of ActionEvents */
export const actionEvents = new EventTarget()
// temp listeners
actionEvents.addEventListener('structureUpdate', () => console.log('structureUpdate'))
actionEvents.addEventListener('drawUpdate', () => console.log('drawUpdate'))
actionEvents.addEventListener('selectionUpdate', () => console.log('selectionUpdate'))


let i = -1
const history = new Array<Action>()
export function getActionHistory() {
    return history
}


export function addAction(action: Action) {
    if (action.added) return
    action.added = true
    if (i < history.length - 1) history.splice(i + 1, history.length)
    if (history.length >= actionHistoryLength) history.shift()
    else ++i
    history.push(action)
}


export function undo() {
    if (i > -1) history[i--].reverse() 
    else notifications.info('Undo', `Nothing to undo`)
}
export function redo() {
    if (i < history.length - 1) history[++i].forward()
    else notifications.info('Redo', `Nothing to redo`)
}