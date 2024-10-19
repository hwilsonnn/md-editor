export const downloadTxtFile = (fileContent: string) => {
    const element = document.createElement("a")
    const file = new Blob([fileContent], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "markdown.md"
    document.body.appendChild(element) // Required for this to work in FireFox
    element.click()
}