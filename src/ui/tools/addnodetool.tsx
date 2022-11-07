import Tool from '../tool'


class AddNodeTool extends Tool {
    constructor() {
        super({
            icon: (
                <div className='toolbutton-icon' title='Add Node'>
                    <i className="fa-brands fa-hashnode"></i>
                </div>
            )
        })
    }
    enable() {

    }
    disable() {

    }
}

export default new AddNodeTool()