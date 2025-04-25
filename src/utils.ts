export const downloadTxtFile = (fileContent: string, fileName?: string) => {
	const element = document.createElement("a")
	const file = new Blob([fileContent], { type: "text/markdown" })
	element.href = URL.createObjectURL(file)
	element.download = `${(fileName && fileName.length > 0
		? fileName
		: "markdown"
	).replaceAll(" ", "")}.md`
	document.body.appendChild(element) // Required for this to work in FireFox
	element.click()
}
