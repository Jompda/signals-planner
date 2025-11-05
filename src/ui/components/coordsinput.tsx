import { useRef, useState } from 'react'
import { toPoint, forward } from 'mgrs'
import { latLng } from 'leaflet'
import { round } from '../../util'
import { latlngToUtm, utmToLatLng } from '../../topoutil'


export function CoordsInput({ latlng, mgrs, utm, updateLatLng }: {
    latlng: LatLng
    mgrs?: string
    utm?: string
    updateLatLng: (latlng: LatLng) => any
}) {
    const defColor = 'lightgray'
    let sll
    if (latlng) sll = fromLatLng(String(latlng.lat), String(latlng.lng))
    else if (mgrs) sll = fromMGRS(mgrs)
    else if (utm) sll = utmToLatLng(utm)

    const [latlngColor, setLatLngColor] = useState(defColor)
    const [mgrsColor, setMgrsColor] = useState(defColor)
    const [utmColor, setUtmColor] = useState(defColor)

    const latRef = useRef<HTMLInputElement>()
    const lngRef = useRef<HTMLInputElement>()
    const mgrsRef = useRef<HTMLInputElement>()
    const utmRef = useRef<HTMLInputElement>()

    function fromLatLng(latitude: string, longitude: string) {
        const lat = +latitude
        const lng = +longitude
        if (
            latitude.length == 0
            || longitude.length == 0
            || isNaN(lat)
            || isNaN(lng)
        ) throw false
        return latLng(lat, lng).wrap()
    }

    function fromMGRS(str: string) {
        const lonlat = toPoint(str)
        return latLng(lonlat[1], lonlat[0])
    }

    function resolve(type: string, src: any) {
        let latlng, mgrsStr, utmStr
        if (type == 'latlng') {
            latlng = src
            mgrsStr = forward([latlng.lng, latlng.lat])
            utmStr = latlngToUtm(latlng)
        } else if (type == 'mgrs') {
            const lonlat = toPoint(src)
            latlng = latLng(lonlat[1], lonlat[0])
            mgrsStr = src
            utmStr = latlngToUtm(latlng)
        } else if (type == 'utm') {
            latlng = utmToLatLng(src)
            mgrsStr = forward([latlng.lng, latlng.lat])
            utmStr = src
        }
        updateLatLng(latlng)
        setLatLngColor(defColor)
        setMgrsColor(defColor)
        setUtmColor(defColor)
        if (latRef.current) latRef.current.value = String(round(latlng.lat as number, 5))
        if (lngRef.current) lngRef.current.value = String(round(latlng.lng as number, 5))
        if (mgrsRef.current) mgrsRef.current.value = mgrsStr
        if (utmRef.current) utmRef.current.value = utmStr
    }

    return (
        <div className='coords-input-menu'>
            <div className='coords-input-menu-latlng'>
                <div>
                    <span>Lat</span>
                    <input
                        ref={latRef}
                        type='text'
                        defaultValue={sll ? round(sll.lat as number, 5) : ''}
                        style={{ backgroundColor: latlngColor }}
                        onChange={() => {
                            try { resolve('latlng', fromLatLng(latRef.current.value, lngRef.current.value)) }
                            catch (e) { setLatLngColor('red') }
                        }}
                    />
                </div>
                <div>
                    <span>Lng</span>
                    <input
                        ref={lngRef}
                        type='text'
                        defaultValue={sll ? round(sll.lng as number, 5) : ''}
                        style={{ backgroundColor: latlngColor }}
                        onChange={() => {
                            try { resolve('latlng', fromLatLng(latRef.current.value, lngRef.current.value)) }
                            catch (e) { setLatLngColor('red') }
                        }}
                    />
                </div>
            </div>

            <button
                onClick={() => {
                    setLatLngColor(defColor)
                    latRef.current.value = lngRef.current.value = ''
                }}
            >Empty</button>

            <span>MGRS</span>
            <input
                ref={mgrsRef}
                type='text'
                defaultValue={sll ? forward([sll.lng, sll.lat]) : ''}
                style={{ backgroundColor: mgrsColor }}
                onChange={() => {
                    try { resolve('mgrs', mgrsRef.current.value) }
                    catch (e) { setMgrsColor('red') }
                }}
            />
            <button
                onClick={() => {
                    setMgrsColor(defColor)
                    mgrsRef.current.value = ''
                }}
            >Empty</button>

            <span>UTM</span>
            <input
                ref={utmRef}
                type='text'
                defaultValue={sll ? latlngToUtm(sll) : ''}
                style={{ backgroundColor: utmColor }}
                onChange={() => {
                    try { resolve('utm', utmRef.current.value) }
                    catch (e) { setUtmColor('red') }
                }}
            />
            <button
                onClick={() => {
                    setUtmColor(defColor)
                    utmRef.current.value = ''
                }}
            >Empty</button>

            <button
                onClick={() => {
                    setLatLngColor(defColor)
                    setMgrsColor(defColor)
                    setUtmColor(defColor)
                    latRef.current.value =
                        lngRef.current.value =
                        mgrsRef.current.value =
                        utmRef.current.value =
                        ''
                    updateLatLng(null)
                }}
            >Clear</button>
        </div>
    )
}