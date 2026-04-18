import "./App.css"
import "./prism.css"
import "./formattedMarkdown.css"
import Markdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"
import { useEffect, useRef } from "react"

import "prism-react-editor/prism/languages/markdown"

import { generateTableOfContents, resolveImageSrc } from "./utils"
import AppContext from "./context"
import TitleInput from "./components/TitleInput"
import FilePicker from "./components/FilePicker"
import Menu from "./components/Menu"
import { useFileManager } from "./hooks/useFileManager"
import { useEditorShortcuts } from "./hooks/useEditorShortcuts"

// Text matching range for click-to-position: sample up to this many chars
const CLICK_MATCH_MAX_LEN = 60
const CLICK_MATCH_MIN_LEN = 8
	const fm = useFileManager()

	// Scroll position refs for maintaining position between views
	const editorScrollRef = useRef(0)
	const previewScrollRef = useRef(0)
	// Target line to jump to after switching to edit mode
	const pendingLineRef = useRef(-1)

	// Wrapper to switch views while saving/restoring scroll positions
	const switchToEdit = (targetLine = -1) => {
		previewScrollRef.current = window.scrollY
		pendingLineRef.current = targetLine
		fm.setIsEditing(true)
	}

	const switchToPreview = () => {
		const editorEl = document.querySelector(".prism-code-editor")
		if (editorEl) editorScrollRef.current = editorEl.scrollTop
		fm.setIsEditing(false)
	}

	// Restore scroll after view switch
	useEffect(() => {
		if (fm.isEditing) {
			// Switched to edit — restore editor scroll, optionally jump to line
			requestAnimationFrame(() => {
				const editorEl = document.querySelector(".prism-code-editor")
				if (editorEl) editorEl.scrollTop = editorScrollRef.current

				if (pendingLineRef.current >= 0) {
					const lineNum = pendingLineRef.current
					pendingLineRef.current = -1
					const textarea =
						document.querySelector<HTMLTextAreaElement>("textarea")
					if (textarea && editorEl) {
						const lines = fm.content.split("\n")
						const charOffset = lines
							.slice(0, lineNum)
							.reduce((acc, l) => acc + l.length + 1, 0)
						textarea.focus()
						textarea.setSelectionRange(charOffset, charOffset)
						const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
						editorEl.scrollTop = lineNum * lineHeight
					}
				}
			})
		} else {
			// Switched to preview — restore preview scroll
			requestAnimationFrame(() => {
				window.scrollTo(0, previewScrollRef.current)
			})
		}
	}, [fm.isEditing])

	const { handleDragOver, handleDrop } = useEditorShortcuts({
		isEditing: fm.isEditing,
		setIsEditing: fm.setIsEditing,
		switchToEdit,
		switchToPreview,
		isDirectoryMode: fm.isDirectoryMode,
		openedDirectory: fm.openedDirectory,
		currentFilePath: fm.currentFilePath,
		content: fm.content,
		setFilePickerOpen: fm.setFilePickerOpen,
		setContent: fm.setContent,
		setSavedValue: fm.setSavedValue,
		setIsDirty: fm.setIsDirty,
		setNoteName: fm.setNoteName,
		setIsDragging: fm.setIsDragging,
		setCurrentFilePath: fm.setCurrentFilePath,
		handleSave: fm.handleSave,
		handleSaveAs: fm.handleSaveAs,
		handleOpenDirectory: fm.handleOpenDirectory,
		handleCloseDirectory: fm.handleCloseDirectory
	})

	const markdownComponents: Components = {
		img: ({ src, alt, ...props }) => (
			<img
				src={resolveImageSrc(src, fm.currentFilePath)}
				alt={alt}
				{...props}
			/>
		)
	}

	// Find the source line for a clicked rendered element
	const findLineForElement = (element: Element): number => {
		const block = element.closest(
			"p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, td, th"
		)
		if (!block) return -1
		const text = block.textContent?.trim() ?? ""
		for (
			let len = Math.min(text.length, CLICK_MATCH_MAX_LEN);
			len >= CLICK_MATCH_MIN_LEN;
			len = Math.floor(len * 0.7)
		) {
			const sample = text.slice(0, len)
			const idx = fm.content.indexOf(sample)
			if (idx >= 0) {
				return fm.content.slice(0, idx).split("\n").length - 1
			}
		}
		return -1
	}

	return (
		<AppContext.Provider
			value={{
				isEditing: fm.isEditing,
				setIsEditing: fm.setIsEditing,
				currentNote: { noteName: fm.noteName, setNoteName: fm.setNoteName },
				openedDirectory: fm.openedDirectory,
				setOpenedDirectory: () => {},
				currentFilePath: fm.currentFilePath,
				setCurrentFilePath: fm.setCurrentFilePath,
				isDirty: fm.isDirty,
				setIsDirty: fm.setIsDirty
			}}
		>
			<main
				className={`app-container ${fm.isDragging ? "dragging" : ""}`}
				onDragOver={(e) => handleDragOver(e, true)}
				onDragLeave={(e) => handleDragOver(e, false)}
				onDrop={handleDrop}
			>
				<div className="title-bar">
					<TitleInput />
					<Menu
						items={[
							{
								icon: "💾",
								label: `Save${fm.isDirty ? " ●" : ""}`,
								onClick: () => fm.handleSave()
							},
							{
								icon: "📂",
								label: "Files",
								onClick: () => fm.setFilePickerOpen(true)
							},
							...(!fm.isEditing
								? [
										{
											icon: "☰",
											label: "Contents",
											onClick: () => generateTableOfContents()
										}
									]
								: [])
						]}
						wordCount={
							fm.content.length === 0
								? 0
								: fm.content.split(/\s|\\n/).filter((word) => word !== "")
										.length
						}
					/>
				</div>
				{fm.isEditing && (
					<Editor
						language="markdown"
						tabSize={4}
						lineNumbers={false}
						wordWrap
						value={fm.savedValue}
						onUpdate={fm.setContent}
					>
						{(editor) => <BasicSetup editor={editor} />}
					</Editor>
				)}
				{!fm.isEditing && (
					<>
						<div
							id="my-markdown-area"
							className="rendered-markdown"
							onClick={(e) => {
								if (!(e.target instanceof HTMLAnchorElement)) {
									const line = findLineForElement(e.target as Element)
									switchToEdit(line)
								}
							}}
						>
							<div id="table-of-contents"></div>
							<Markdown
								remarkPlugins={[remarkGfm]}
								components={markdownComponents}
							>
								{fm.content}
							</Markdown>
						</div>
					</>
				)}
			</main>

			<FilePicker
				isOpen={fm.filePickerOpen}
				onClose={() => fm.setFilePickerOpen(false)}
				openedDirectory={fm.openedDirectory}
				currentFilePath={fm.currentFilePath}
				onOpenDirectory={fm.handleOpenDirectory}
				onSelectFile={fm.handleSelectFile}
				onCreateFile={fm.handleCreateFile}
				onDeleteFile={fm.handleDeleteFile}
				onCreateDirectory={fm.handleCreateDirectory}
				onMoveFile={fm.handleMoveFile}
				fileTree={fm.fileTree}
				recentDirectories={fm.recentDirectories}
				onRemoveRecentDir={fm.handleRemoveRecentDir}
				onOpenRecentDir={fm.handleOpenRecentDir}
			/>
		</AppContext.Provider>
	)
}

export default App
