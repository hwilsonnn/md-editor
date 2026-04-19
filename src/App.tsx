import "./App.css"
import "./prism.css"
import "./formattedMarkdown.css"
import Markdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { Editor, PrismEditor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"
import { setSelection } from "prism-react-editor/utils"

import "prism-react-editor/prism/languages/markdown"

import { generateTableOfContents, resolveImageSrc } from "./utils"
import AppContext from "./context"
import TitleInput from "./components/TitleInput"
import FilePicker from "./components/FilePicker"
import Menu from "./components/Menu"
import { useFileManager } from "./hooks/useFileManager"
import { useEditorShortcuts } from "./hooks/useEditorShortcuts"
import { useCallback, useEffect, useRef } from "react"

function App() {
	const fm = useFileManager()
	const editorRef = useRef<PrismEditor | null>(null)
	const scrollRef = useRef<HTMLDivElement>(null)
	const scrollAnchorRef = useRef<{ text: string; charOffset: number } | null>(
		null
	)
	const pendingCursorRef = useRef<number | null>(null)

	// Capture scroll anchor: find the first visible text near the top of the viewport
	// and record its character offset in the raw markdown content
	const captureScroll = useCallback(() => {
		if (fm.isEditing) {
			// In editor mode: the editor scrolls internally
			const editor = editorRef.current
			if (!editor) return
			// The editor's scrollable container
			const editorEl =
				scrollRef.current?.querySelector<HTMLElement>(".prism-code-editor")
			if (!editorEl) return

			const editorRect = editorEl.getBoundingClientRect()
			const probeY = editorRect.top + 40
			const lines = editorEl.querySelectorAll(".pce-line")
			let charPos = 0
			const content = fm.content

			for (const line of lines) {
				const rect = line.getBoundingClientRect()
				if (rect.bottom >= probeY) {
					const snippet = content.slice(charPos, charPos + 60).trim()
					scrollAnchorRef.current = {
						text: snippet,
						charOffset: charPos
					}
					return
				}
				const lineText = line.textContent || ""
				charPos += lineText.length + 1
			}
		} else {
			// In preview mode: .content-scroll is the scrollable element
			const el = scrollRef.current
			if (!el) return

			const containerRect = el.getBoundingClientRect()
			const probeY = containerRect.top + 40
			const blocks = el.querySelectorAll(
				".rendered-markdown p, .rendered-markdown h1, .rendered-markdown h2, .rendered-markdown h3, .rendered-markdown h4, .rendered-markdown h5, .rendered-markdown h6, .rendered-markdown li, .rendered-markdown pre, .rendered-markdown blockquote, .rendered-markdown tr"
			)
			const content = fm.content
			for (const block of blocks) {
				const rect = block.getBoundingClientRect()
				if (rect.bottom >= probeY) {
					const blockText = (block.textContent || "").trim()
					if (blockText.length > 0) {
						const idx = content.indexOf(blockText.slice(0, 40))
						scrollAnchorRef.current = {
							text: blockText.slice(0, 60),
							charOffset: idx >= 0 ? idx : -1
						}
					}
					break
				}
			}
		}
	}, [fm.isEditing, fm.content])

	const { handleDragOver, handleDrop } = useEditorShortcuts({
		isEditing: fm.isEditing,
		setIsEditing: fm.setIsEditing,
		isDirectoryMode: fm.isDirectoryMode,
		openedDirectory: fm.openedDirectory,
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
		handleCloseDirectory: fm.handleCloseDirectory,
		currentFilePath: fm.currentFilePath,
		editorRef,
		captureScroll
	})

	// Restore scroll position after mode switch using the anchor text
	useEffect(() => {
		const anchor = scrollAnchorRef.current
		if (!anchor) return

		// Use double-rAF to ensure the DOM has fully rendered
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (fm.isEditing) {
					// Switching TO editor mode: scroll the editor's own container
					const editorEl =
						scrollRef.current?.querySelector<HTMLElement>(".prism-code-editor")
					if (!editorEl) return

					if (anchor.charOffset >= 0) {
						const lines = editorEl.querySelectorAll(".pce-line")
						let charPos = 0
						for (const line of lines) {
							const lineText = line.textContent || ""
							if (charPos + lineText.length >= anchor.charOffset) {
								const rect = line.getBoundingClientRect()
								const editorRect = editorEl.getBoundingClientRect()
								editorEl.scrollTop += rect.top - editorRect.top - 40
								return
							}
							charPos += lineText.length + 1
						}
					}
					// Fallback: search for the anchor text in lines
					if (anchor.text) {
						const lines = editorEl.querySelectorAll(".pce-line")
						const searchText = anchor.text.slice(0, 30)
						for (const line of lines) {
							const lineText = line.textContent || ""
							if (
								lineText.includes(searchText) ||
								searchText.includes(lineText.trim().slice(0, 30))
							) {
								const rect = line.getBoundingClientRect()
								const editorRect = editorEl.getBoundingClientRect()
								editorEl.scrollTop += rect.top - editorRect.top - 40
								return
							}
						}
					}
				} else {
					// Switching TO preview mode: scroll .content-scroll
					const el = scrollRef.current
					if (!el) return

					const blocks = el.querySelectorAll(
						".rendered-markdown p, .rendered-markdown h1, .rendered-markdown h2, .rendered-markdown h3, .rendered-markdown h4, .rendered-markdown h5, .rendered-markdown h6, .rendered-markdown li, .rendered-markdown pre, .rendered-markdown blockquote, .rendered-markdown tr"
					)

					if (anchor.text) {
						const searchText = anchor.text.slice(0, 30)
						for (const block of blocks) {
							const blockText = (block.textContent || "").trim()
							if (
								blockText.includes(searchText) ||
								searchText.includes(blockText.slice(0, 30))
							) {
								const rect = block.getBoundingClientRect()
								const containerRect = el.getBoundingClientRect()
								el.scrollTop += rect.top - containerRect.top - 40
								return
							}
						}
					}

					// Fallback: use character offset ratio
					if (anchor.charOffset >= 0 && fm.content.length > 0) {
						const ratio = anchor.charOffset / fm.content.length
						const maxScroll = el.scrollHeight - el.clientHeight
						el.scrollTop = ratio * maxScroll
					}
				}
			})
		})
	}, [fm.isEditing, fm.content])

	// Set cursor position after editor mounts
	useEffect(() => {
		if (fm.isEditing && pendingCursorRef.current !== null) {
			const offset = pendingCursorRef.current
			pendingCursorRef.current = null
			requestAnimationFrame(() => {
				const editor = editorRef.current
				if (editor) {
					setSelection(editor, offset, offset)
					editor.textarea?.focus()
				}
			})
		}
	}, [fm.isEditing])

	// Click-to-edit: find approximate cursor position from clicked text
	const handleMarkdownClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (e.target instanceof HTMLAnchorElement) return

			captureScroll()

			const sel = window.getSelection()
			if (sel && sel.rangeCount > 0) {
				const range = sel.getRangeAt(0)
				const textNode = range.startContainer
				const offsetInNode = range.startOffset

				// Find closest block-level parent
				let block = textNode.parentElement
				const blockTags = new Set([
					"P",
					"H1",
					"H2",
					"H3",
					"H4",
					"H5",
					"H6",
					"LI",
					"BLOCKQUOTE",
					"TD",
					"TH"
				])
				while (block && !blockTags.has(block.tagName)) {
					block = block.parentElement
				}

				if (block) {
					const blockText = block.textContent || ""
					// Get text before cursor within the block
					const beforeCursor = blockText.slice(0, offsetInNode)

					// Search for block text in raw markdown
					const content = fm.content
					const idx = content.indexOf(blockText)
					if (idx !== -1) {
						pendingCursorRef.current = idx + beforeCursor.length
					} else {
						// Try partial match with first 20 chars
						const snippet = blockText.slice(0, 20)
						const partialIdx = content.indexOf(snippet)
						if (partialIdx !== -1) {
							pendingCursorRef.current = partialIdx + beforeCursor.length
						}
					}
				}
			}

			fm.setIsEditing(true)
		},
		[fm.content, fm.setIsEditing, captureScroll]
	)

	const markdownComponents: Components = {
		img: ({ src, alt, ...props }) => (
			<img
				src={resolveImageSrc(src, fm.currentFilePath)}
				alt={alt}
				{...props}
			/>
		)
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
				<div className="content-scroll" ref={scrollRef}>
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
							{(editor) => {
								editorRef.current = editor
								return <BasicSetup editor={editor} />
							}}
						</Editor>
					)}
					{!fm.isEditing && (
						<div
							id="my-markdown-area"
							className="rendered-markdown"
							onClick={handleMarkdownClick}
						>
							<div id="table-of-contents"></div>
							<Markdown
								remarkPlugins={[remarkGfm]}
								components={markdownComponents}
							>
								{fm.content}
							</Markdown>
						</div>
					)}
				</div>
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
