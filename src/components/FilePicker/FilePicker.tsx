import { useState } from "react"
import { FileTreeNode } from "../../electron.d"
import "./FilePicker.css"
import FileTree from "./FileTree"

interface FilePickerProps {
	isOpen: boolean
	onClose: () => void
	openedDirectory: string | null
	currentFilePath: string | null
	onOpenDirectory: () => void
	onSelectFile: (filePath: string) => void
	onCreateFile: (dirPath: string, fileName: string) => void
	onDeleteFile: (filePath: string) => void
	onCreateDirectory: (parentPath: string, folderName: string) => void
	onMoveFile: (sourcePath: string, targetDir: string) => void
	fileTree: FileTreeNode[]
	recentDirectories: string[]
	onRemoveRecentDir: (dir: string) => void
	onOpenRecentDir: (dir: string) => void
}

const FilePicker = ({
	isOpen,
	onClose,
	openedDirectory,
	currentFilePath,
	onOpenDirectory,
	onSelectFile,
	onCreateFile,
	onDeleteFile,
	onCreateDirectory,
	onMoveFile,
	fileTree,
	recentDirectories,
	onRemoveRecentDir,
	onOpenRecentDir
}: FilePickerProps) => {
	const [newFileName, setNewFileName] = useState("")
	const [isCreating, setIsCreating] = useState(false)
	const [newFolderName, setNewFolderName] = useState("")
	const [isCreatingFolder, setIsCreatingFolder] = useState(false)

	if (!isOpen) return null

	const handleCreateFile = () => {
		if (!newFileName.trim() || !openedDirectory) return
		let name = newFileName.trim()
		if (!name.match(/\.(md|txt|markdown)$/i)) {
			name += ".md"
		}
		onCreateFile(openedDirectory, name)
		setNewFileName("")
		setIsCreating(false)
	}

	const handleCreateFolder = () => {
		if (!newFolderName.trim() || !openedDirectory) return
		onCreateDirectory(openedDirectory, newFolderName.trim())
		setNewFolderName("")
		setIsCreatingFolder(false)
	}

	return (
		<div className="file-picker-overlay" onClick={onClose}>
			<div className="file-picker-modal" onClick={(e) => e.stopPropagation()}>
				<div className="file-picker-header">
					<h2>{openedDirectory ? "Files" : "Open Directory"}</h2>
					<button className="file-picker-close" onClick={onClose}>
						✕
					</button>
				</div>

				<div className="file-picker-content">
					<button className="file-picker-open-dir" onClick={onOpenDirectory}>
						📂 Open Directory...
					</button>

					{openedDirectory && (
						<>
							<div className="file-picker-current-dir">
								<span className="dir-label">Current:</span>
								<span className="dir-path" title={openedDirectory}>
									{openedDirectory}
								</span>
							</div>

							<div className="file-picker-actions">
								{isCreating ? (
									<div className="new-file-input-row">
										<input
											className="new-file-input"
											value={newFileName}
											onChange={(e) => setNewFileName(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleCreateFile()
												if (e.key === "Escape") setIsCreating(false)
											}}
											placeholder="filename.md"
											autoFocus
										/>
										<button onClick={handleCreateFile}>✓</button>
										<button onClick={() => setIsCreating(false)}>✕</button>
									</div>
								) : isCreatingFolder ? (
									<div className="new-file-input-row">
										<input
											className="new-file-input"
											value={newFolderName}
											onChange={(e) => setNewFolderName(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleCreateFolder()
												if (e.key === "Escape") setIsCreatingFolder(false)
											}}
											placeholder="folder name"
											autoFocus
										/>
										<button onClick={handleCreateFolder}>✓</button>
										<button onClick={() => setIsCreatingFolder(false)}>
											✕
										</button>
									</div>
								) : (
									<div className="file-picker-action-buttons">
										<button onClick={() => setIsCreating(true)}>
											+ New File
										</button>
										<button onClick={() => setIsCreatingFolder(true)}>
											+ New Folder
										</button>
									</div>
								)}
							</div>

							<div className="file-tree-container">
								<FileTree
									nodes={fileTree}
									currentFilePath={currentFilePath}
									onSelectFile={(path) => {
										onSelectFile(path)
										onClose()
									}}
									onDeleteFile={onDeleteFile}
									onMoveFile={onMoveFile}
								/>
							</div>
						</>
					)}

					{!openedDirectory && recentDirectories.length > 0 && (
						<div className="recent-directories">
							<h3>Recent Directories</h3>
							<ul>
								{recentDirectories.map((dir) => (
									<li key={dir}>
										<button
											className="recent-dir-btn"
											onClick={() => {
												onOpenRecentDir(dir)
												onClose()
											}}
											title={dir}
										>
											📁 {dir}
										</button>
										<button
											className="recent-dir-remove"
											onClick={() => onRemoveRecentDir(dir)}
											title="Remove from recent"
										>
											✕
										</button>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default FilePicker
