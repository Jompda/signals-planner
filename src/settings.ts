
const defaultSettings = [
    ['defaultEmitterHeight', 'number|25'], // NOTE: Medium-specific emitter heights?
    ['defaultLinkMedium', 'string|SHF1'],
    ['defaultUnitSIDC', 'string|30031000001211000000']
]

export function getSetting(name: string) {
    let item = localStorage.getItem(name)
    if (!item)
        for (const setting of defaultSettings)
            if (setting[0] === name) item = setting[1]
    const parts = item.split("|", 2)
    if (parts[0] === "number") return parseFloat(parts[1])
    return parts[1]
}

export function setSetting(name: string, value: any) {
    let type = 'string'
    if (typeof value === 'number') type = 'number'
    localStorage.setItem(name, type + '|' + value)
}