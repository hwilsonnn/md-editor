const SUPPORTED_FILE_TYPES = [
	"text/plain",
	"text/markdown",
	"text/x-markdown",
	"application/json",
	"application/xml",
	"text/csv",
	"text/html"
]

export const downloadMarkdownFile = (
	fileContent: string,
	fileName?: string
) => {
	const element = document.createElement("a")
	const file = new Blob([fileContent], { type: "text/markdown" })
	element.href = URL.createObjectURL(file)
	element.download = `${(fileName && fileName.length > 0
		? fileName
		: "markdown"
	).replaceAll(" ", "_")}-${new Date().toISOString()}.md`
	document.body.appendChild(element)
	element.click()
	document.body.removeChild(element)
	URL.revokeObjectURL(element.href)
}

export const parseFileName = (fileName: string): string => {
	const match = fileName.match(/^([^-]+)/)
	return match?.[1].replaceAll("_", " ") ?? fileName
}

export const handleFileDrop = (
	files: FileList | undefined,
	onFileLoad: (content: string, fileName: string) => void
): void => {
	if (!files || files.length === 0) return

	const file = files[0]

	// Check if file type is supported
	if (
		!SUPPORTED_FILE_TYPES.includes(file.type) &&
		!/\.(md|txt|json|xml|csv|html)$/i.test(file.name)
	) {
		alert(
			"Unsupported file type. Please drop a plain text, markdown, JSON, XML, CSV, or HTML file."
		)
		return
	}

	// Confirm before replacing content
	if (
		file.size > 0 &&
		!window.confirm(
			"Are you sure you want to replace the current content with the dropped file?"
		)
	) {
		return
	}

	const reader = new FileReader()
	reader.onload = (event) => {
		const content = event.target?.result as string
		onFileLoad(content, parseFileName(file.name))
	}
	reader.readAsText(file)
}
