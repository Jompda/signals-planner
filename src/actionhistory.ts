import { notifications } from '.'
import Action from './actions/action'


export type ActionEvent = 'structureUpdate' | 'drawUpdate' | 'selectionUpdate'
/**
 * Event is one of ActionEvents
 */
export const actionEvents = new EventTarget()
actionEvents.addEventListener('structureUpdate', () => console.log('structureUpdate'))
actionEvents.addEventListener('drawUpdate', () => console.log('drawUpdate'))
actionEvents.addEventListener('selectionUpdate', () => console.log('selectionUpdate'))


let i = -1
const timeline = new Array<Action>()
export function getActionTimeline() {
    return timeline
}


export function addAction(action: Action) {
    if (action.added) return
    action.added = true
    if (i < timeline.length - 1)
        timeline.splice(i + 1, timeline.length)
    timeline.push(action)
    i++
}


export function undo() {
    if (i > -1) timeline[i--].reverse()
    notifications.info('Undo', `History: ${i + 1}`)
}
export function redo() {
    if (i < timeline.length - 1) timeline[++i].forward()
    notifications.info('Redo', `History: ${i + 1}`)
}