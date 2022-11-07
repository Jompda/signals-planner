import Tool from '../tool'
import { Symbol as MilSymbol } from 'milsymbol'


class AddNodeTool extends Tool {
    public symbol: MilSymbol
    constructor() {
        const symbol = new MilSymbol({ sidc: 'SFGPUUS----B', size: 16 })
        super({
            icon: (
                <div className='toolbutton-icon' title='Add Node'>
                    <img src={symbol.toDataURL()} />
                </div>
            )
        })
        this.symbol = symbol
    }
    enable() {

    }
    disable() {

    }
}

export default new AddNodeTool()