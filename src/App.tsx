import "./App.css"
import "./prism.css"
import "./formattedMarkdown.css"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"

import "prism-react-editor/prism/languages/markdown"

import { generateTableOfContents } from "./utils"
import AppContext from "./context"
import TitleInput from "./components/TitleInput"
import FilePicker from "./components/FilePicker"
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
					<button
						style={{ whiteSpace: "nowrap" }}
						onClick={() => fm.setFilePickerOpen(true)}
						title="Open files (Ctrl+O)"
					>
						📂 Files
					</button>
					{!fm.isEditing && (
						<button
							style={{ whiteSpace: "nowrap" }}
							onClick={() => generateTableOfContents()}
						>
							☰ Contents
						</button>
					)}
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
							<Markdown remarkPlugins={[remarkGfm]}>{fm.content}</Markdown>
						</div>
					</>
				)}
			</main>
			<hr color="darkgray" />
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "5px"
				}}
			>
				<span
					style={{
						fontSize: "0.875rem"
					}}
				>
					{fm.content.length === 0
						? 0
						: fm.content.split(/\s|\\n/).filter((word) => word !== "")
								.length}{" "}
					words
				</span>
				<button onClick={() => fm.handleSave()}>💾 Save</button>
			</div>

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
