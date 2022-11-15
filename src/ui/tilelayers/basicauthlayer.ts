import { DomUtil, GridLayer, Util } from 'leaflet'
import { getImage } from 'tiledata'


(GridLayer as any).basicAuthLayer = GridLayer.extend({
    initialize: function (url: string, options: any) {
        this._url = url
        this._auth = 'Basic ' + btoa(options.username + ':' + (options.password || ''))
        console.log(this._auth)
        Util.setOptions(this, options)
    },

    createTile: function (coords: TileCoords, callback: Function) {
        const canvas = DomUtil.create('canvas', 'leaflet-tile')
        canvas.width = canvas.height = 256
        const ctx = canvas.getContext('2d')
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
                })
            ctx.drawImage(img, 0, 0)
            setTimeout(() => callback(null, canvas), 0)
        }
        gd()
        return canvas
    }
})
