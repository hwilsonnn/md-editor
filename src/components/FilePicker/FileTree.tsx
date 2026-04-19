import { DragEvent, useState } from "react"
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
}

const FileTree = ({
	nodes,
	currentFilePath,
	onSelectFile,
	onDeleteFile,
	onMoveFile,
	depth = 0
}: FileTreeProps) => {
	const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
	const [dropTargetPath, setDropTargetPath] = useState<string | null>(null)

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

	const handleDragStart = (e: DragEvent, nodePath: string) => {
		e.dataTransfer.setData("text/plain", nodePath)
		e.dataTransfer.effectAllowed = "move"
	}

	const handleDragOver = (e: DragEvent, dirPath: string) => {
		e.preventDefault()
		e.stopPropagation()
		e.dataTransfer.dropEffect = "move"
		setDropTargetPath(dirPath)
	}

	const handleDragLeave = (e: DragEvent) => {
		e.stopPropagation()
		setDropTargetPath(null)
	}

	const handleDrop = (e: DragEvent, targetDir: string) => {
		e.preventDefault()
		e.stopPropagation()
		setDropTargetPath(null)
		const sourcePath = e.dataTransfer.getData("text/plain")
		if (sourcePath && sourcePath !== targetDir) {
			onMoveFile(sourcePath, targetDir)
		}
	}

	return (
		<ul className="file-tree" style={{ paddingLeft: depth > 0 ? 16 : 0 }}>
			{nodes.map((node) => (
				<li key={node.path} className="file-tree-item">
					{node.isDirectory ? (
						<>
							<button
								className={`file-tree-dir ${dropTargetPath === node.path ? "file-tree-drop-target" : ""}`}
								onClick={() => toggleDir(node.path)}
								draggable
								onDragStart={(e) => handleDragStart(e, node.path)}
								onDragOver={(e) => handleDragOver(e, node.path)}
								onDragLeave={handleDragLeave}
								onDrop={(e) => handleDrop(e, node.path)}
							>
								<span className="file-tree-icon">
									{expandedDirs.has(node.path) ? "▼" : "▶"}
								</span>
								📁 {node.name}
							</button>
							{expandedDirs.has(node.path) && node.children && (
								<FileTree
									nodes={node.children}
									currentFilePath={currentFilePath}
									onSelectFile={onSelectFile}
									onDeleteFile={onDeleteFile}
									onMoveFile={onMoveFile}
									depth={depth + 1}
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
									onDragStart={(e) => handleDragStart(e, node.path)}
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
