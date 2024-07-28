import options from '../options'

const defaultSettings = new Map([
    ['defaultEmitterHeight', 'number|25'], // NOTE: Medium-specific emitter heights?
    ['defaultLinkMedium', 'string|SHF1'],
    ['defaultUnitSIDC', 'string|30031000001211000000']
])
for (const field in options)
    defaultSettings.set(field, 'string|' + (options as any)[field])

export function getSetting(name: string) {
    let item = localStorage.getItem(name)
    if (!item) item = defaultSettings.get(name)
    const parts = item.split("|", 2)
    if (parts[0] === "number") return parseFloat(parts[1])
    return parts[1]
}

export function setSetting(name: string, value: any) {
    let type = 'string'
    if (typeof value === 'number') type = 'number'
    localStorage.setItem(name, type + '|' + value)
}