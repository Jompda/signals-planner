import { DomUtil, GridLayer, Util } from 'leaflet'
import { getImage } from 'tiledata'


(GridLayer as any).basicAuthLayer = GridLayer.extend({
    initialize: function (url: string, options: any) {
        this._url = url
        this._auth = 'Basic ' + btoa(options.username + ':' + (options.password || ''))
        Util.setOptions(this, options)
    },

    createTile: function (coords: TileCoords, callback: Function) {
        const div = DomUtil.create('div', 'leaflet-tile')
        const gd = async () => {
            const img = await getImage(
                this._url
                    .replace('{z}', String(coords.z))
                    .replace('{y}', String(coords.y))
                    .replace('{x}', String(coords.x))
                , {
                    headers: {
                        'Authorization': this._auth
                    }
                }
            )
            div.appendChild(img)
            setTimeout(() => callback(null, div), 0)
        }
        gd()
        return div
    }
})
