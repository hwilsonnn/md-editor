const parseFileName = (fileName: string) => {
	const match = fileName.match(/^([^-]+)/)
	return match?.[1].replaceAll("_", " ") ?? fileName
}

/**
 * Resolves an image src from markdown relative to the current file's directory.
 * Absolute URLs (http/https/data) are returned as-is.
 * Relative paths are converted to the md-asset:// protocol for Electron to serve.
 */
export function resolveImageSrc(
	src: string | undefined,
	currentFilePath: string | null
): string | undefined {
	if (!src) return src
	// Absolute URLs / data URIs — leave as-is
	if (/^(https?:|data:|blob:)/i.test(src)) return src
	if (!currentFilePath) return src

	// Get the directory of the current file
	const dir = currentFilePath.substring(
		0,
		Math.max(
			currentFilePath.lastIndexOf("/"),
			currentFilePath.lastIndexOf("\\")
		)
	)

	// Normalize to forward slashes and combine
	const combined = `${dir}/${src}`.replace(/\\/g, "/")

	// Resolve . and .. segments
	const parts = combined.split("/")
	const resolved: string[] = []
	for (const part of parts) {
		if (part === "..") resolved.pop()
		else if (part !== "." && part !== "") resolved.push(part)
	}

	const absolutePath = resolved.join("/")
	return `md-asset:///${absolutePath}`
}

export const handleFileDrop = async (
	files: FileList,
	setContent: (content: string) => void,
	setFileName: (fileName: string) => void,
	openedDirectory: string | null
) => {
	if (files && files.length > 0) {
		const file = files[0]

		const markdownTypes = ["text/plain", "text/markdown", "text/x-markdown"]
		const scratchpadTypes = [
			...markdownTypes,
			"application/json",
			"application/xml",
			"text/csv",
			"text/html"
		]

		const allowedTypes = openedDirectory ? markdownTypes : scratchpadTypes

		if (
			!allowedTypes.includes(file.type) &&
			!/\.(md|txt|markdown)$/i.test(file.name) &&
			(openedDirectory || !/\.(json|xml|csv|html)$/i.test(file.name))
		) {
			await window.electronAPI?.showMessageBox({
				type: "warning",
				buttons: ["OK"],
				title: "Unsupported File",
				message: openedDirectory
					? "In directory mode, only markdown/text files can be dropped."
					: "Unsupported file type. Please drop a plain text, markdown, JSON, XML, CSV, or HTML file."
			})
			return null
		}

		const confirm = await window.electronAPI?.showMessageBox({
			type: "question",
			buttons: ["Yes", "No"],
			defaultId: 0,
			title: "Replace Content",
			message:
				"Are you sure you want to replace the current content with the dropped file?"
		})

		if (confirm !== 0 || file.size === 0) return null

		// Use Electron's File.path to get the real filesystem path
		const filePath = (file as File & { path: string }).path

		if (filePath && window.electronAPI) {
			const fileContent = await window.electronAPI.readFile(filePath)
			setContent(fileContent)
			setFileName(parseFileName(file.name))
			return filePath
		} else {
			// Fallback to FileReader
			return new Promise<null>((resolve) => {
				const reader = new FileReader()
				reader.onload = (event) => {
					const text = event.target?.result as string
					setContent(text)
					setFileName(parseFileName(file.name))
					resolve(null)
				}
				reader.readAsText(file)
			})
		}
	}
	return null
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
