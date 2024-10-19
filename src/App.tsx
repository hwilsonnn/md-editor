import { useCallback, useEffect, useState } from "react"
import "./App.css"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"

import "prism-react-editor/prism/languages/markdown"
import "prism-react-editor/layout.css"
import "prism-react-editor/themes/github-dark.css"
import "prism-react-editor/search.css"

function App() {
	const [savedValue, setSavedValue] = useState("")
	const [content, setContent] = useState("")
	const [isEditing, setIsEditing] = useState(true)

	const escCallback = useCallback(
		(e: KeyboardEvent) => {
			if (e.code === "Escape") {
				console.log("content is", content)
				setIsEditing(false)
			}
		},
		[content]
	)

	useEffect(() => {
		if (isEditing) {
			console.log("adding")
			document.addEventListener("keydown", escCallback, true)
		} else {
			console.log("removing")
			document.removeEventListener("keydown", escCallback, true)
			setSavedValue(content)
		}
	}, [isEditing])

	return (
		<div
			style={{
				height: "90dvh",
				width: "75dvw",
				textAlign: "left",
				// border: "1px solid gray",
				borderRadius: "8px",
			}}
		>
			{isEditing && (
				<Editor
					language="markdown"
					tabSize={4}
					lineNumbers={false}
					value={savedValue}
					onUpdate={setContent}
				>
					{(editor) => <BasicSetup editor={editor} />}
				</Editor>
			)}
			{!isEditing && (
				<div
					id="my-markdown-area"
					style={{ height: "100%", width: "100%", padding: "0px 10px" }}
					onClick={() => setIsEditing(true)}
				>
					<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
				</div>
			)}
		</div>
	)
}

export default App
