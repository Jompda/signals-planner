import { useRef, useState } from 'react'
import * as mgrs from 'mgrs'
import * as utm from 'utm'
import * as L from 'leaflet'


export function CoordsInput(props: any) {
    let sll
    if (props.latlng) sll = fromLatLng(String(props.latlng.lat), String(props.latlng.lng))
    else if (props.mgrs) sll = fromMGRS(props.mgrs)
    else if (props.utm) sll = utmToLatLng(props.utm)

    const [latlngColor, setLatLngColor] = useState('lightgray')
    const [mgrsColor, setMgrsColor] = useState('lightgray')
    const [utmColor, setUtmColor] = useState('lightgray')

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
        return L.latLng(lat, lng)
    }

    function fromMGRS(str: string) {
        const lonlat = mgrs.toPoint(str)
        return L.latLng(lonlat[1], lonlat[0])
    }

    function latlngToUtm(latlng: L.LatLng) {
        const s = utm.fromLatLon(latlng.lat, latlng.lng)
        return `${s.zoneNum}${s.zoneLetter} ${Math.floor(s.easting)} ${Math.floor(s.northing)}`
    }

    function utmToLatLng(str: string) {
        const parts = str.split(' ')
        const s1 = parts[0]
        const s = utm.toLatLon(
            +parts[1],
            +parts[2],
            +s1.slice(0, s1.length - 1),
            s1[s1.length - 1]
        )
        return L.latLng(s.latitude, s.longitude)
    }

    function resolve(type: string, src: any) {
        let latlng, mgrsStr, utmStr
        if (type == 'latlng') {
            latlng = src
            mgrsStr = mgrs.forward([latlng.lng, latlng.lat])
            utmStr = latlngToUtm(latlng)
        }
        else if (type == 'mgrs') {
            const lonlat = mgrs.toPoint(src)
            latlng = L.latLng(lonlat[1], lonlat[0])
            mgrsStr = src
            utmStr = latlngToUtm(latlng)
        } else {
            latlng = utmToLatLng(src)
            mgrsStr = mgrs.forward([latlng.lng, latlng.lat])
            utmStr = src
        }
        props.updateLatLng(latlng)
        setLatLngColor('lightgray')
        setMgrsColor('lightgray')
        setUtmColor('lightgray')
        if (latRef.current) latRef.current.value = String(round(latlng.lat as number, 5))
        if (lngRef.current) lngRef.current.value = String(round(latlng.lng as number, 5))
        if (mgrsRef.current) mgrsRef.current.value = mgrsStr
        if (utmRef.current) utmRef.current.value = utmStr
    }

    return (
        <>
            <span>Lat:</span>
            <input
                ref={latRef}
                type='text'
                defaultValue={sll ? round(sll.lat as number, 5) : ''}
                style={{ backgroundColor: latlngColor }}
            />
            <span>Lng:</span>
            <input
                ref={lngRef}
                type='text'
                defaultValue={sll ? round(sll.lng as number, 5) : ''}
                style={{ backgroundColor: latlngColor }}
            />
            <button onClick={() => latRef.current.value = lngRef.current.value = ''}>Empty</button>
            <button onClick={() => {
                try { resolve('latlng', fromLatLng(latRef.current.value, lngRef.current.value)) }
                catch (e) { setLatLngColor('red') }
            }}>Set</button>
            <br />

            <span>MGRS:</span>
            <input
                ref={mgrsRef}
                type='text'
                defaultValue={sll ? mgrs.forward([sll.lng, sll.lat]) : ''}
                style={{ backgroundColor: mgrsColor }}
            />
            <button onClick={() => mgrsRef.current.value = ''}>Empty</button>
            <button onClick={() => {
                try { resolve('mgrs', mgrsRef.current.value) }
                catch (e) { setMgrsColor('red') }
            }}>Set</button>
            <br />

            <span>UTM:</span>
            <input
                ref={utmRef}
                type='text'
                defaultValue={sll ? latlngToUtm(sll) : ''}
                style={{ backgroundColor: utmColor }}
            />
            <button onClick={() => utmRef.current.value = ''}>Empty</button>
            <button onClick={() => {
                try { resolve('utm', utmRef.current.value) }
                catch (e) { setUtmColor('red') }
            }}>Set</button>
        </>
    )
}


function round(n: number, d: number) {
    const m = 10 ** d
    return Math.round(n * m) / m
}