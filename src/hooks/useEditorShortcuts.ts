import { DragEvent, useCallback, useEffect } from "react"
import { handleFileDrop } from "../utils"

const api = window.electronAPI

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
				setIsEditing(false)
			}
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [handleSave, handleSaveAs, handleOpenDirectory, isEditing, setIsEditing])

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
