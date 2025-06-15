export const downloadTxtFile = (fileContent: string, fileName?: string) => {
	const element = document.createElement("a")
	const file = new Blob([fileContent], { type: "text/markdown" })
	element.href = URL.createObjectURL(file)
	element.download = `${(fileName && fileName.length > 0
		? fileName
		: "markdown"
	).replaceAll(" ", "_")}-${new Date().toISOString()}.md`
	document.body.appendChild(element) // Required for this to work in FireFox
	element.click()
}

const parseFileName = (fileName: string) => {
	const match = fileName.match(/^([^-]+)/)
	return match?.[1].replaceAll("_", " ") ?? fileName
}

export const handleFileDrop = (
	files: FileList,
	setContent: (content: string) => void,
	setFileName: (fileName: string) => void
) => {
	if (files && files.length > 0) {
		const file = files[0]
		const supportedTypes = [
			"text/plain",
			"text/markdown",
			"text/x-markdown",
			"application/json",
			"application/xml",
			"text/csv",
			"text/html"
		]

		// For some reason my experience is that the file type doesn't always seem to be populated
		if (!supportedTypes.includes(file.type) && !/.*\.md$/.test(file.name)) {
			alert(
				"Unsupported file type. Please drop a plain text, markdown, JSON, XML, CSV, or HTML file."
			)
			return
		}

		if (
			file.size > 0 &&
			window.confirm(
				"Are you sure you want to replace the current content with the dropped file?"
			)
		) {
			const reader = new FileReader()
			reader.onload = (event) => {
				const text = event.target?.result as string

				setContent(text)
			}
			reader.readAsText(file)

			setFileName(parseFileName(file.name))
		}
	}
}

export const generateTableOfContents = () => {
	// A lovely little script from https://taylor.town/toc-snippet
	const toc = document.getElementById("table-of-contents") as HTMLDivElement

	if (toc.innerHTML.length > 0) {
		toc.innerHTML = ""
	} else {
		for (const x of document.querySelectorAll(
			"h1, h2, h3, h4"
		) as NodeListOf<HTMLHeadingElement>) {
			const id = x.innerText.replaceAll(/[^a-z0-9]/gi, "")
			x.id = id
			const item = `<li><a href="#${id}">${x.innerText}</a></li>`
			switch (x.tagName.toLowerCase()) {
				case "h1":
					toc.insertAdjacentHTML("beforeend", `${item}<ul></ul>`)
					break
				case "h2":
				case "h3":
				case "h4":
					;[...toc.querySelectorAll("ul")]
						?.pop()
						?.insertAdjacentHTML("beforeend", item)
					break
			}
		}
	}
}
