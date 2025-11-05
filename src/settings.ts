import options from '../options'

export const settingsEvents = new EventTarget()

const defaultSettings = new Map([
    ['defaultEmitterHeight', 'number|25'], // Just at average tree height in Finland where this is targeted
    ['defaultLinkMedium', 'string|SHF1'],
    ['defaultUnitSIDC', 'string|30031000001211000000'],
    ['defaultActionHistoryLength', 'number|500']
])
for (const field in options)
    defaultSettings.set(field, 'string|' + (options as any)[field])


export function getSetting(name: string, jsonReviver?: (this: any, key: string, value: any) => any, defaultSetting = false) {
    let item: string
    if (!defaultSetting) item = localStorage.getItem(name)
    if (!item) item = defaultSettings.get(name)
    return reviveItem(item, jsonReviver)
}

export function setSetting(name: string, value: any) {
    let type = 'string'
    if (typeof value === 'number') type = 'number'
    localStorage.setItem(name, type + '|' + value)
    settingsEvents.dispatchEvent(new Event(name))
}

export function resetSetting(name: string) {
    localStorage.removeItem(name)
    settingsEvents.dispatchEvent(new Event(name))
}

function reviveItem(item: string, jsonReviver?: (this: any, key: string, value: any) => any) {
    const [type, value] = item.split("|", 2)
    switch (type) {
        case 'number': return parseFloat(value)
        case 'json': return JSON.parse(value, jsonReviver)
        default: return value
    }
}