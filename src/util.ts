

export function startDownload(name: string, type: string, content: string) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type }))
    a.download = name
    a.click()
}


export function round(value: number, decimal = 2) {
    const m = Math.pow(10, decimal)
    return Math.round(value * m) / m
}