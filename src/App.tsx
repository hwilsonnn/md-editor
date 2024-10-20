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

	return (
		<>
			<div
				style={{
					height: "85dvh",
					width: "75dvw",
					textAlign: "left",
					// border: "1px solid #303741",
					// borderRadius: "8px",
					padding: isEditing ? "0 12px 0 0" : "0 0 0 12px",
				}}
			>
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
						style={{ height: "100%", width: "100%" }}
						onClick={() => setIsEditing(true)}
					>
						<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
					</div>
				)}
			</div>
			<hr />
			<button onClick={() => downloadTxtFile(content)}>Download</button>
		</>
	)
}

export default App
