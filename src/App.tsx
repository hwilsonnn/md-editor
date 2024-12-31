import { useCallback, useEffect, useState } from "react"
import "./App.css"
import "./prism.css"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"

import "prism-react-editor/prism/languages/markdown"

import { downloadTxtFile } from "./utils"
import AppContext from "./context"
import NameInput from "./NameInput"

function App() {
	const [savedValue, setSavedValue] = useState("")
	const [content, setContent] = useState("")
	const [isEditing, setIsEditing] = useState(true)
	const [noteName, setNoteName] = useState("")

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

	// Something like this to handle pasting images?
	// useEffect(() => {
	// 	document.addEventListener("paste", (clipboardstuff) => {
	// 		console.log("paste event", clipboardstuff.clipboardData)
	// 		console.log("trying to get data", clipboardstuff.clipboardData?.files[0])
	// 	})
	// }, [])

	return (
		<AppContext.Provider
			value={{
				isEditing,
				setIsEditing,
				currentNote: { noteName, setNoteName },
			}}
		>
			<div
				className="app-container"
				style={{
					padding: isEditing ? "0 12px 0 0" : "0 0 0 12px",
				}}
			>
				<NameInput />
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
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					justifyContent: "center",
					gap: "5px",
				}}
			>
				<button>💾 Save</button>
				<button>➕ New Note</button>
				<button onClick={() => downloadTxtFile(content)}>⬇ Download</button>
			</div>
		</AppContext.Provider>
	)
}

export default App
