
const defaultSettings = [
    ['defaultEmitterHeight', 'number|25'], // NOTE: Medium-specific emitter heights?
    ['defaultLinkMedium', 'string|SHF1'],
    ['defaultUnitSIDC', 'string|30031000001211000000']
]

export function initializeSettings() {
    for (const setting of defaultSettings)
        if (!localStorage.getItem(setting[0]))
            localStorage.setItem(setting[0], setting[1])
}

export function getSetting(name: string) {
    let item = localStorage.getItem(name)
    const parts = item.split("|", 2)
    if (parts[0] === "number") return parseFloat(parts[1])
    return parts[1]
}

export function setSetting(name: string, value: any) {
    let type = 'string'
    if (typeof value === 'number') type = 'number'
    localStorage.setItem(name, type + '|' + value)
}