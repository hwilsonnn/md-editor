import { DragEvent, useCallback, useEffect } from "react"
import { handleFileDrop } from "../utils"

const api = window.electronAPI

const IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"image/bmp"
]
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i

interface UseEditorShortcutsOptions {
	isEditing: boolean
	setIsEditing: (v: boolean) => void
	switchToEdit: () => void
	switchToPreview: () => void
	isDirectoryMode: boolean
	openedDirectory: string | null
	currentFilePath: string | null
	content: string
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
}

export function useEditorShortcuts({
	isEditing,
	setIsEditing,
	switchToEdit,
	switchToPreview,
	isDirectoryMode,
	openedDirectory,
	currentFilePath,
	content,
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
	handleCloseDirectory
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
					if (isEditing) {
						switchToPreview()
					} else {
						switchToEdit()
					}
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
		switchToEdit,
		switchToPreview,
		setFilePickerOpen
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
				switchToPreview()
			}
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [handleSave, handleSaveAs, handleOpenDirectory, isEditing, switchToPreview])

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

			// Handle image drops in edit mode
			if (
				IMAGE_MIME_TYPES.includes(file.type) ||
				IMAGE_EXT_RE.test(file.name)
			) {
				if (isEditing && currentFilePath && api) {
					const filePath = (file as File & { path: string }).path
					const currentDir = currentFilePath.substring(
						0,
						Math.max(
							currentFilePath.lastIndexOf("/"),
							currentFilePath.lastIndexOf("\\")
						)
					)
					try {
						const filename = await api.copyImageToDir(filePath, currentDir)
						const textarea =
							document.querySelector<HTMLTextAreaElement>("textarea")
						const cursorPos = textarea?.selectionStart ?? content.length
						const imageMarkdown = `![${filename}](./${filename})`
						const newContent =
							content.slice(0, cursorPos) +
							imageMarkdown +
							content.slice(cursorPos)
						setSavedValue(newContent)
						setContent(newContent)
						setIsDirty(true)
					} catch (err) {
						await api.showMessageBox({
							type: "error",
							buttons: ["OK"],
							title: "Image Error",
							message: `Failed to insert image: ${err instanceof Error ? err.message : String(err)}`
						})
					}
				} else {
					await api?.showMessageBox({
						type: "warning",
						buttons: ["OK"],
						title: "Image Drop",
						message:
							"Open a file in edit mode to insert images at the cursor."
					})
				}
				return
			}

			const droppedFilePath = await handleFileDrop(
				e.dataTransfer.files,
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
			isEditing,
			currentFilePath,
			content,
			openedDirectory,
			setIsDragging,
			setContent,
			setSavedValue,
			setIsEditing,
			setIsDirty,
			setNoteName,
			setCurrentFilePath
		]
	)

	return { handleDragOver, handleDrop }
}
