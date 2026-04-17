import "./App.css"
import "./prism.css"
import "./formattedMarkdown.css"
import Markdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"

import "prism-react-editor/prism/languages/markdown"

import { generateTableOfContents, resolveImageSrc } from "./utils"
import AppContext from "./context"
import TitleInput from "./components/TitleInput"
import FilePicker from "./components/FilePicker"
import Menu from "./components/Menu"
import { useFileManager } from "./hooks/useFileManager"
import { useEditorShortcuts } from "./hooks/useEditorShortcuts"

function App() {
	const fm = useFileManager()

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
									fm.setIsEditing(true)
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
				fileTree={fm.fileTree}
				recentDirectories={fm.recentDirectories}
				onRemoveRecentDir={fm.handleRemoveRecentDir}
				onOpenRecentDir={fm.handleOpenRecentDir}
			/>
		</AppContext.Provider>
	)
}

export default App
