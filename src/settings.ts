import options from '../options'

const defaultSettings = new Map([
    ['defaultEmitterHeight', 'number|25'],
    ['defaultLinkMedium', 'string|SHF1'],
    ['defaultUnitSIDC', 'string|30031000001211000000'],
    ['defaultActionHistoryLength', 'number|500']
])
for (const field in options)
    defaultSettings.set(field, 'string|' + (options as any)[field])

export function getSetting(name: string, jsonReviver?: (this: any, key: string, value: any) => any) {
    let item = localStorage.getItem(name)
    if (!item) item = defaultSettings.get(name)
    const [type, value] = item.split("|", 2)
    switch (type) {
        case 'number': return parseFloat(value)
        case 'json': return JSON.parse(value, jsonReviver)
        default: return value
    }
}

export function setSetting(name: string, value: any) {
    let type = 'string'
    if (typeof value === 'number') type = 'number'
    localStorage.setItem(name, type + '|' + value)
}