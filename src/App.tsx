import { useCallback, useEffect, useState } from "react"
import "./App.css"
import "./prism.css"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"

import "prism-react-editor/prism/languages/markdown"

import { downloadTxtFile } from "./utils"

function App() {
	const [savedValue, setSavedValue] = useState("")
	const [content, setContent] = useState("")
	const [isEditing, setIsEditing] = useState(true)
	const [noteTitle, setNoteTitle] = useState("")
	const [isSidebarOpen, setSidebarOpen] = useState(false)

	const escCallback = useCallback(
		(e: KeyboardEvent) => {
			if (e.code === "Escape") {
				setIsEditing(false)
			}
		},
		[content]
	)

	useEffect(() => {
		if (isEditing) {
			document.addEventListener("keydown", escCallback, true)
		} else {
			document.removeEventListener("keydown", escCallback, true)
			setSavedValue(content)
		}
	}, [isEditing])

	// TODO:
	// Add file title, this can get pulled into the browser tab name
	// Create new note + browse existing notes

	// PWA integration
	// indexeddb integration
	// light mode + dark mode toggle??
	// add tests
	// Support more languages

	return (
		<>
			<div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
				<div
					style={{
						background: "green",
						display: "flex",
						flexDirection: "column",
						height: "100%",
						borderRadius: "0px 10px 10px 0px",
						alignItems: "flex-start",
						gap: "5px",
					}}
				>
					<div>
						<button onClick={() => setSidebarOpen(false)}>close</button>
					</div>
					<div>
						<button>+ New Note</button>
					</div>
				</div>
			</div>
			<div
				className="app-container"
				style={{
					padding: isEditing ? "0 12px 0 0" : "0 0 0 12px",
				}}
			>
				<div
					style={{
						paddingLeft: isEditing ? "12px" : "0",
						width: "100%",
						display: "flex",
						flexDirection: "column",
						marginBottom: isEditing ? "8px" : "0",
					}}
				>
					{/* <div>
						<button onClick={() => setSidebarOpen(!isSidebarOpen)}>Open</button>
					</div> */}
					<input
						value={noteTitle}
						className="title-input"
						placeholder="Note name"
						onInput={(e) => setNoteTitle((e.target as HTMLInputElement).value)}
						onBlur={() => {
							if (noteTitle && noteTitle.length > 0) {
								document.title = `${noteTitle} - Markdown Editor`
							}
						}}
					/>
				</div>
				{isEditing && (
					<Editor
						language="markdown"
						tabSize={4}
						lineNumbers={false}
						wordWrap
						value={savedValue}
						onUpdate={setContent}
					>
						{(editor) => <BasicSetup editor={editor} />}
					</Editor>
				)}
				{!isEditing && (
					<div
						id="my-markdown-area"
						style={{ height: "100%", width: "100%", overflowY: "scroll" }}
						onClick={() => setIsEditing(true)}
					>
						<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
					</div>
				)}
			</div>
			<hr color="darkgray" />
			<button onClick={() => downloadTxtFile(content)}>Download</button>
		</>
	)
}

export default App
