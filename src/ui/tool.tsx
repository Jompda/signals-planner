export interface ToolOptions {
    icon: JSX.Element
}


export default class Tool {
    public icon: string
    constructor(options?: ToolOptions) {
        Object.assign(this, options)
    }
    enable() { }
    disable() { }
}
export class DefaultTool extends Tool {
    constructor() {
        super({
            icon: <i className="fa fa-mouse-pointer"></i>
        })
    }
}