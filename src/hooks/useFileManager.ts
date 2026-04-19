import { useCallback, useEffect, useRef, useState } from "react"
import { ElectronAPI, FileTreeNode } from "../electron.d"

const api: ElectronAPI | undefined = window.electronAPI

export function useFileManager() {
	const [savedValue, setSavedValue] = useState("")
	const [content, setContent] = useState("")
	const [isEditing, setIsEditing] = useState(true)
	const [noteName, setNoteName] = useState("")
	const [isDragging, setIsDragging] = useState(false)

	// Directory mode state
	const [openedDirectory, setOpenedDirectory] = useState<string | null>(null)
	const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
	const [isDirty, setIsDirty] = useState(false)
	const [filePickerOpen, setFilePickerOpen] = useState(false)
	const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
	const [recentDirectories, setRecentDirectories] = useState<string[]>([])

	const isDirectoryMode = openedDirectory !== null
	const contentRef = useRef(content)
	contentRef.current = content

	const updateWindowTitle = useCallback(
		(dirty: boolean, fileName?: string | null, dir?: string | null) => {
			const name = fileName ?? noteName
			const directory = dir ?? openedDirectory
			const prefix = dirty ? "● " : ""
			if (directory && name) {
				api?.setTitle(`${prefix}${name} - ${directory} - Markdown Editor`)
			} else if (name) {
				api?.setTitle(`${prefix}${name} - Markdown Editor`)
			} else {
				api?.setTitle(`${prefix}Markdown Editor`)
			}
		},
		[noteName, openedDirectory]
	)

	// Track dirty state from content changes
	useEffect(() => {
		if (content !== savedValue) {
			if (!isDirty) {
				setIsDirty(true)
				updateWindowTitle(true)
			}
		}
	}, [content, savedValue])

	// Refresh file tree when directory changes
	const refreshFileTree = useCallback(async (dir: string) => {
		if (!api) return
		const tree = await api.listFiles(dir)
		setFileTree(tree)
	}, [])

	useEffect(() => {
		if (openedDirectory) {
			refreshFileTree(openedDirectory)
		}
	}, [openedDirectory, refreshFileTree])

	// Load recent directories on mount
	useEffect(() => {
		api?.getRecentDirectories().then(setRecentDirectories)
	}, [])

	// Save handler
	const handleSave = useCallback(async () => {
		if (!api) return
		try {
			if (isDirectoryMode && currentFilePath) {
				await api.saveFile(currentFilePath, contentRef.current)
				setSavedValue(contentRef.current)
				setIsDirty(false)
				updateWindowTitle(false)
			} else {
				const filePath = await api.saveFileAs(
					contentRef.current,
					noteName || "untitled"
				)
				if (filePath) {
					setSavedValue(contentRef.current)
					setIsDirty(false)
					updateWindowTitle(false)
				}
			}
		} catch (err) {
			await api.showMessageBox({
				type: "error",
				buttons: ["OK"],
				title: "Save Error",
				message: `Failed to save: ${err instanceof Error ? err.message : String(err)}`
			})
		}
	}, [isDirectoryMode, currentFilePath, noteName, updateWindowTitle])

	// Save As handler
	const handleSaveAs = useCallback(async () => {
		if (!api) return
		try {
			const filePath = await api.saveFileAs(
				contentRef.current,
				noteName || "untitled"
			)
			if (filePath) {
				setSavedValue(contentRef.current)
				setIsDirty(false)
				updateWindowTitle(false)
			}
		} catch (err) {
			await api.showMessageBox({
				type: "error",
				buttons: ["OK"],
				title: "Save Error",
				message: `Failed to save: ${err instanceof Error ? err.message : String(err)}`
			})
		}
	}, [noteName, updateWindowTitle])

	// Check unsaved changes before destructive action
	const checkUnsaved = useCallback(async (): Promise<boolean> => {
		if (!isDirty || !api) return true
		const response = await api.showMessageBox({
			type: "question",
			buttons: ["Save", "Don't Save", "Cancel"],
			defaultId: 0,
			title: "Unsaved Changes",
			message: "Do you want to save changes before proceeding?"
		})
		if (response === 0) {
			await handleSave()
			return true
		}
		if (response === 1) return true
		return false // Cancel
	}, [isDirty, handleSave])

	// Open directory handler
	const handleOpenDirectory = useCallback(async () => {
		const canProceed = await checkUnsaved()
		if (!canProceed) return

		const dirPath = await api.openDirectory()
		if (dirPath) {
			setOpenedDirectory(dirPath)
			setCurrentFilePath(null)
			setContent("")
			setSavedValue("")
			setNoteName("")
			setIsDirty(false)
			await api.addRecentDirectory(dirPath)
			const recent = await api.getRecentDirectories()
			setRecentDirectories(recent)
			updateWindowTitle(false, null, dirPath)
		}
	}, [checkUnsaved, updateWindowTitle])

	// Open a recent directory
	const handleOpenRecentDir = useCallback(
		async (dirPath: string) => {
			const canProceed = await checkUnsaved()
			if (!canProceed) return

			setOpenedDirectory(dirPath)
			setCurrentFilePath(null)
			setContent("")
			setSavedValue("")
			setNoteName("")
			setIsDirty(false)
			await api.addRecentDirectory(dirPath)
			const recent = await api.getRecentDirectories()
			setRecentDirectories(recent)
			updateWindowTitle(false, null, dirPath)
		},
		[checkUnsaved, updateWindowTitle]
	)

	// Select file in picker
	const handleSelectFile = useCallback(
		async (filePath: string) => {
			const canProceed = await checkUnsaved()
			if (!canProceed) return

			try {
				const fileContent = await api.readFile(filePath)
				const fileName = filePath.split(/[/\\]/).pop() || "untitled"
				setContent(fileContent)
				setSavedValue(fileContent)
				setCurrentFilePath(filePath)
				setNoteName(fileName)
				setIsDirty(false)
				setIsEditing(true)
				updateWindowTitle(false, fileName)
			} catch (err) {
				await api.showMessageBox({
					type: "error",
					buttons: ["OK"],
					title: "Read Error",
					message: `Failed to open file: ${err instanceof Error ? err.message : String(err)}`
				})
			}
		},
		[checkUnsaved, updateWindowTitle]
	)

	// Create file in directory
	const handleCreateFile = useCallback(
		async (dirPath: string, fileName: string) => {
			try {
				const filePath = await api.createFile(dirPath, fileName)
				if (openedDirectory) await refreshFileTree(openedDirectory)
				await handleSelectFile(filePath)
			} catch (err) {
				await api.showMessageBox({
					type: "error",
					buttons: ["OK"],
					title: "Create Error",
					message: `Failed to create file: ${err instanceof Error ? err.message : String(err)}`
				})
			}
		},
		[openedDirectory, refreshFileTree, handleSelectFile]
	)

	// Delete file
	const handleDeleteFile = useCallback(
		async (filePath: string) => {
			try {
				const deleted = await api.deleteFile(filePath)
				if (deleted) {
					if (openedDirectory) await refreshFileTree(openedDirectory)
					if (currentFilePath === filePath) {
						setContent("")
						setSavedValue("")
						setCurrentFilePath(null)
						setNoteName("")
						setIsDirty(false)
						updateWindowTitle(false, null)
					}
				}
			} catch (err) {
				await api.showMessageBox({
					type: "error",
					buttons: ["OK"],
					title: "Delete Error",
					message: `Failed to delete file: ${err instanceof Error ? err.message : String(err)}`
				})
			}
		},
		[openedDirectory, currentFilePath, refreshFileTree, updateWindowTitle]
	)

	// Close directory
	const handleCloseDirectory = useCallback(async () => {
		const canProceed = await checkUnsaved()
		if (!canProceed) return

		setOpenedDirectory(null)
		setCurrentFilePath(null)
		setContent("")
		setSavedValue("")
		setNoteName("")
		setIsDirty(false)
		setFileTree([])
		updateWindowTitle(false, null, null)
	}, [checkUnsaved, updateWindowTitle])

	// Create directory
	const handleCreateDirectory = useCallback(
		async (parentPath: string, dirName: string) => {
			try {
				await api.createDirectory(parentPath, dirName)
				if (openedDirectory) await refreshFileTree(openedDirectory)
			} catch (err) {
				await api.showMessageBox({
					type: "error",
					buttons: ["OK"],
					title: "Create Directory Error",
					message: `Failed to create directory: ${err instanceof Error ? err.message : String(err)}`
				})
			}
		},
		[openedDirectory, refreshFileTree]
	)

	// Move file or directory
	const handleMoveFile = useCallback(
		async (sourcePath: string, targetDir: string) => {
			try {
				const newPath = await api.moveFile(sourcePath, targetDir)
				if (openedDirectory) await refreshFileTree(openedDirectory)
				// Update currentFilePath if the moved file is currently open
				if (currentFilePath === sourcePath) {
					setCurrentFilePath(newPath)
				}
			} catch (err) {
				await api.showMessageBox({
					type: "error",
					buttons: ["OK"],
					title: "Move Error",
					message: `Failed to move: ${err instanceof Error ? err.message : String(err)}`
				})
			}
		},
		[openedDirectory, currentFilePath, refreshFileTree]
	)

	// Remove recent directory
	const handleRemoveRecentDir = useCallback(async (dir: string) => {
		if (!api) return
		const updated = await api.removeRecentDirectory(dir)
		setRecentDirectories(updated)
	}, [])

	// Sync editing state
	useEffect(() => {
		if (!isEditing) {
			setSavedValue(content)
		}
		if (isEditing) {
			const editor = document.querySelector("textarea")
			if (editor) editor.spellcheck = true
		}
	}, [isEditing])

	return {
		// State
		content,
		setContent,
		savedValue,
		setSavedValue,
		isEditing,
		setIsEditing,
		noteName,
		setNoteName,
		isDragging,
		setIsDragging,
		openedDirectory,
		currentFilePath,
		setCurrentFilePath,
		isDirty,
		setIsDirty,
		filePickerOpen,
		setFilePickerOpen,
		fileTree,
		recentDirectories,
		isDirectoryMode,

		// Handlers
		handleSave,
		handleSaveAs,
		handleOpenDirectory,
		handleOpenRecentDir,
		handleSelectFile,
		handleCreateFile,
		handleDeleteFile,
		handleCloseDirectory,
		handleRemoveRecentDir,
		handleCreateDirectory,
		handleMoveFile,
		refreshFileTree
	}
}
