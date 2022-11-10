import Action from './actions/action'


let i = -1
const timeline = new Array<Action>()


export function addAction(action: Action) {
    console.log('add', i)
    if (i < timeline.length - 1)
        timeline.splice(i + 1, timeline.length)
    timeline.push(action)
    i++
    console.log(timeline)
}


export function undo() {
    if (i > -1) timeline[i--].reverse()
}
export function redo() {
    if (i < timeline.length - 1) timeline[++i].forward()
}