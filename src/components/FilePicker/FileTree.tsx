import { useState } from "react"
import { FileTreeNode } from "../../electron.d"

const SELECTABLE_EXTENSIONS = [".md", ".txt", ".markdown"]

function isSelectableFile(name: string): boolean {
	const ext = name.slice(name.lastIndexOf(".")).toLowerCase()
	return SELECTABLE_EXTENSIONS.includes(ext)
}

interface FileTreeProps {
	nodes: FileTreeNode[]
	currentFilePath: string | null
	onSelectFile: (filePath: string) => void
	onDeleteFile: (filePath: string) => void
	onMoveFile: (sourcePath: string, targetDir: string) => void
	depth?: number
	draggedPath?: string | null
	onDragStart?: (path: string) => void
	onDragEnd?: () => void
}

const FileTree = ({
	nodes,
	currentFilePath,
	onSelectFile,
	onDeleteFile,
	onMoveFile,
	depth = 0,
	draggedPath = null,
	onDragStart,
	onDragEnd
}: FileTreeProps) => {
	const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
	const [dropTarget, setDropTarget] = useState<string | null>(null)
	// Top-level owns the drag state when depth === 0
	const [localDraggedPath, setLocalDraggedPath] = useState<string | null>(null)

	const activeDraggedPath = depth === 0 ? localDraggedPath : draggedPath
	const handleDragStart = depth === 0 ? setLocalDraggedPath : onDragStart
	const handleDragEnd =
		depth === 0 ? () => setLocalDraggedPath(null) : onDragEnd

	const toggleDir = (path: string) => {
		setExpandedDirs((prev) => {
			const next = new Set(prev)
			if (next.has(path)) {
				next.delete(path)
			} else {
				next.add(path)
			}
			return next
		})
	}

	const handleDropOnDir = (targetDir: string) => {
		if (activeDraggedPath && activeDraggedPath !== targetDir) {
			// Prevent moving into same parent directory
			const parentOfDragged = activeDraggedPath.substring(
				0,
				Math.max(
					activeDraggedPath.lastIndexOf("/"),
					activeDraggedPath.lastIndexOf("\\")
				)
			)
			// Prevent moving a folder into itself or into one of its descendants
			const sep = activeDraggedPath.includes("/") ? "/" : "\\"
			const isDescendant =
				targetDir === activeDraggedPath ||
				targetDir.startsWith(activeDraggedPath + sep)
			if (parentOfDragged !== targetDir && !isDescendant) {
				onMoveFile(activeDraggedPath, targetDir)
			}
		}
		setDropTarget(null)
		if (depth === 0) setLocalDraggedPath(null)
	}

	return (
		<ul className="file-tree" style={{ paddingLeft: depth > 0 ? 16 : 0 }}>
			{nodes.map((node) => (
				<li key={node.path} className="file-tree-item">
					{node.isDirectory ? (
						<>
							<div
								className={`file-tree-dir-row ${dropTarget === node.path ? "file-tree-drop-target" : ""}`}
								onDragOver={(e) => {
									e.preventDefault()
									e.stopPropagation()
									setDropTarget(node.path)
								}}
								onDragLeave={() => setDropTarget(null)}
								onDrop={(e) => {
									e.preventDefault()
									e.stopPropagation()
									handleDropOnDir(node.path)
								}}
							>
								<button
									className="file-tree-dir"
									draggable
									onDragStart={() => handleDragStart?.(node.path)}
									onDragEnd={handleDragEnd}
									onClick={() => toggleDir(node.path)}
								>
									<span className="file-tree-icon">
										{expandedDirs.has(node.path) ? "▼" : "▶"}
									</span>
									📁 {node.name}
								</button>
							</div>
							{expandedDirs.has(node.path) && node.children && (
								<FileTree
									nodes={node.children}
									currentFilePath={currentFilePath}
									onSelectFile={onSelectFile}
									onDeleteFile={onDeleteFile}
									onMoveFile={onMoveFile}
									depth={depth + 1}
									draggedPath={activeDraggedPath}
									onDragStart={handleDragStart}
									onDragEnd={handleDragEnd}
								/>
							)}
						</>
					) : (
						(() => {
							const selectable = isSelectableFile(node.name)
							return (
								<div
									className={`file-tree-file ${
										currentFilePath === node.path ? "file-tree-active" : ""
									} ${!selectable ? "file-tree-disabled" : ""}`}
									draggable
									onDragStart={() => handleDragStart?.(node.path)}
									onDragEnd={handleDragEnd}
								>
									<button
										className="file-tree-file-btn"
										onClick={() => selectable && onSelectFile(node.path)}
										disabled={!selectable}
									>
										📄 {node.name}
									</button>
									{selectable && (
										<button
											className="file-tree-delete"
											onClick={() => onDeleteFile(node.path)}
											title="Delete file"
										>
											🗑
										</button>
									)}
								</div>
							)
						})()
					)}
				</li>
			))}
		</ul>
	)
}

export default FileTree
