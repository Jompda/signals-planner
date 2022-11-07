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