import { control, Control, DomUtil, Map } from 'leaflet'

control.zoomRatio = function() {
    return new Control.ZoomRatio() as Control
}

Control.ZoomRatio = Control.extend({
    options: {
        position: 'bottomleft'
    },

    onAdd: function (map: Map) {
        this.container = DomUtil.create('div')
        this.text = DomUtil.create('div', 'leaflet-control-scale-line', this.container)
        map.on('moveend', this.update, this)
        map.whenReady(this.update, this)
        return this.container
    },

    update: function() {
        /*
         * https://gis.stackexchange.com/questions/423633/calculating-leaflet-scale-ratio-for-the-particular-zoom-level
         * Based on the source above, implemented the scale ratio.
         */
        var map = this._map,
		    y = map.getSize().y / 2;
        var zoomScale = Math.round(
            map.distance(
                map.containerPointToLatLng([0, y]),
                map.containerPointToLatLng([38, y]))
        )
        this.text.innerText = `1cm : ${zoomScale}m`
    }
})



