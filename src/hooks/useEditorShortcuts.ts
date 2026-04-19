import { DragEvent, MutableRefObject, useCallback, useEffect } from "react"
import { handleFileDrop } from "../utils"
import { PrismEditor } from "prism-react-editor"
import { insertText } from "prism-react-editor/utils"

const api = window.electronAPI

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]

function isImageFile(fileName: string): boolean {
	const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
	return IMAGE_EXTENSIONS.includes(ext)
}

function getMimeType(fileName: string): string {
	const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
	const map: Record<string, string> = {
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".gif": "image/gif",
		".webp": "image/webp",
		".svg": "image/svg+xml"
	}
	return map[ext] || "application/octet-stream"
}

interface UseEditorShortcutsOptions {
	isEditing: boolean
	setIsEditing: (v: boolean) => void
	isDirectoryMode: boolean
	openedDirectory: string | null
	setFilePickerOpen: (v: boolean) => void
	setContent: (v: string) => void
	setSavedValue: (v: string) => void
	setIsDirty: (v: boolean) => void
	setNoteName: (v: string) => void
	setIsDragging: (v: boolean) => void
	setCurrentFilePath: (v: string | null) => void
	handleSave: () => Promise<void>
	handleSaveAs: () => Promise<void>
	handleOpenDirectory: () => Promise<void>
	handleCloseDirectory: () => Promise<void>
	currentFilePath: string | null
	editorRef: MutableRefObject<PrismEditor | null>
	captureScroll: () => void
}

export function useEditorShortcuts({
	isEditing,
	setIsEditing,
	isDirectoryMode,
	openedDirectory,
	setFilePickerOpen,
	setContent,
	setSavedValue,
	setIsDirty,
	setNoteName,
	setIsDragging,
	setCurrentFilePath,
	handleSave,
	handleSaveAs,
	handleOpenDirectory,
	handleCloseDirectory,
	currentFilePath,
	editorRef,
	captureScroll
}: UseEditorShortcutsOptions) {
	// Menu actions from main process
	useEffect(() => {
		if (!api) return
		const cleanup = api.onMenuAction((action) => {
			switch (action) {
				case "open-directory":
					handleOpenDirectory()
					break
				case "new-file":
					if (isDirectoryMode) {
						setFilePickerOpen(true)
					}
					break
				case "save":
					handleSave()
					break
				case "save-as":
					handleSaveAs()
					break
				case "close-directory":
					handleCloseDirectory()
					break
				case "toggle-view":
					captureScroll()
					setIsEditing(!isEditing)
					break
			}
		})
		return cleanup
	}, [
		handleOpenDirectory,
		handleSave,
		handleSaveAs,
		handleCloseDirectory,
		isDirectoryMode,
		isEditing,
		setIsEditing,
		setFilePickerOpen,
		captureScroll
	])

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault()
				if (e.shiftKey) {
					handleSaveAs()
				} else {
					handleSave()
				}
			}
			if ((e.ctrlKey || e.metaKey) && e.key === "o") {
				e.preventDefault()
				handleOpenDirectory()
			}
			if (e.code === "Escape" && isEditing) {
				captureScroll()
				setIsEditing(false)
			}
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [
		handleSave,
		handleSaveAs,
		handleOpenDirectory,
		isEditing,
		setIsEditing,
		captureScroll
	])

	// Drag and drop
	const handleDragOver = useCallback(
		(e: DragEvent<HTMLElement>, dragging: boolean) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragging(dragging)
		},
		[setIsDragging]
	)

	const handleDrop = useCallback(
		async (e: DragEvent<HTMLElement>) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragging(false)

			const files = e.dataTransfer.files
			if (!files || files.length === 0) return

			const file = files[0]
			const filePath = (file as File & { path: string }).path

			// Check if it's an image file
			if (isImageFile(file.name)) {
				if (openedDirectory && currentFilePath && api) {
					// Get the directory of the current file
					const fileDir = currentFilePath.substring(
						0,
						Math.max(
							currentFilePath.lastIndexOf("/"),
							currentFilePath.lastIndexOf("\\")
						)
					)
					const destPath = `${fileDir}/${file.name}`.replace(/\\/g, "/")

					try {
						const finalPath = await api.copyFile(filePath, destPath)
						const finalName = finalPath.split(/[/\\]/).pop()!
						const markdownImg = `![${finalName}](./${finalName})`

						// Insert at cursor if editor is available
						const editor = editorRef.current
						if (editor && isEditing) {
							const [start, end] = editor.getSelection()
							insertText(editor, markdownImg, start, end)
						} else {
							// Switch to editing and append
							const editor = editorRef.current
							const current = editor?.value || ""
							setContent(current ? current + "\n" + markdownImg : markdownImg)
							if (!isEditing) setIsEditing(true)
						}
					} catch (err) {
						await api.showMessageBox({
							type: "error",
							buttons: ["OK"],
							title: "Image Copy Error",
							message: `Failed to copy image: ${err instanceof Error ? err.message : String(err)}`
						})
					}
				} else if (api) {
					// No directory open — offer base64 fallback
					const response = await api.showMessageBox({
						type: "warning",
						buttons: ["Open Directory First", "Insert as Base64", "Cancel"],
						defaultId: 0,
						title: "No Working Directory",
						message:
							"Open a directory first to copy images next to your file, or insert as base64 inline."
					})

					if (response === 0) {
						handleOpenDirectory()
					} else if (response === 1) {
						try {
							const base64 = await api.readFileBase64(filePath)
							const mime = getMimeType(file.name)
							const markdownImg = `![${file.name}](data:${mime};base64,${base64})`

							const editor = editorRef.current
							if (editor && isEditing) {
								const [start, end] = editor.getSelection()
								insertText(editor, markdownImg, start, end)
							} else {
								const current = editorRef.current?.value || ""
								setContent(current ? current + "\n" + markdownImg : markdownImg)
								if (!isEditing) setIsEditing(true)
							}
						} catch (err) {
							await api.showMessageBox({
								type: "error",
								buttons: ["OK"],
								title: "Base64 Error",
								message: `Failed to read image: ${err instanceof Error ? err.message : String(err)}`
							})
						}
					}
				}
				return
			}

			// Existing markdown/text file drop logic
			const droppedFilePath = await handleFileDrop(
				files,
				(fileContent: string) => {
					setContent(fileContent)
					setSavedValue(fileContent)
					setIsEditing(false)
					setIsDirty(false)
				},
				setNoteName,
				openedDirectory
			)

			if (droppedFilePath && typeof droppedFilePath === "string") {
				if (openedDirectory && !droppedFilePath.startsWith(openedDirectory)) {
					setCurrentFilePath(null)
				} else if (openedDirectory) {
					setCurrentFilePath(droppedFilePath)
				}
			}
		},
		[
			openedDirectory,
			currentFilePath,
			isEditing,
			editorRef,
			setIsDragging,
			setContent,
			setSavedValue,
			setIsEditing,
			setIsDirty,
			setNoteName,
			setCurrentFilePath,
			handleOpenDirectory
		]
	)

	return { handleDragOver, handleDrop }
}
