import Tool from '../tool'

// <FontAwesomeIcon icon="fa-solid fa-draw-square" />
// <FontAwesomeIcon icon="fa-solid fa-object-union" />
// <FontAwesomeIcon icon="fa-solid fa-object-subtract" />
// <FontAwesomeIcon icon="fa-solid fa-object-group" />
class DefaultTool extends Tool {
    constructor() {
        super({
            icon: (
                <div className='toolbutton-icon' title='Cursor'>
                    <i className="fa fa-mouse-pointer"></i>
                </div>
            )
        })
    }
}
export default new DefaultTool()