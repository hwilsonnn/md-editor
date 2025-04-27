import { useCallback, useEffect, useState } from "react"
import "./App.css"
import "./prism.css"
import "./formattedMarkdown.css"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"

import "prism-react-editor/prism/languages/markdown"
import "prism-react-editor/prism/languages/typescript"

import { downloadTxtFile } from "./utils"
import AppContext from "./context"
import NameInput from "./NameInput"

function App() {
	const [savedValue, setSavedValue] = useState("")
	const [content, setContent] = useState("")
	const [isEditing, setIsEditing] = useState(true)
	const [noteName, setNoteName] = useState("")

	const hideBottomBar = localStorage.getItem("hide-bottom-bar")

	const escCallback = useCallback(
		(e: KeyboardEvent) => {
			if (e.code === "Escape") {
				setIsEditing(false)
			}
		},
		[content]
	)

	const downloadContent = useCallback(() => {
		downloadTxtFile(content, noteName)
	}, [content, noteName])

	const unload = (e: BeforeUnloadEvent) => {
		if (!window.confirm("are you sure you want to leave the page")) {
			e.preventDefault()
		}
	}
	const downloadOnSave = (e: KeyboardEvent) => {
		if ((e.ctrlKey || e.metaKey) && e.key === "s") {
			e.preventDefault()
			downloadContent()
		}
	}

	useEffect(() => {
		window.addEventListener("beforeunload", unload)
		document.addEventListener("keydown", downloadOnSave)

		return () => {
			window.removeEventListener("beforeunload", unload)
			document.removeEventListener("keydown", downloadOnSave)
		}
	}, [downloadContent])

	useEffect(() => {
		if (isEditing) {
			document.addEventListener("keydown", escCallback, true)
			const editor = document.querySelector("textarea")
			if (editor) {
				editor.spellcheck = true
			}
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

	const [bottomBarVisible, setBottomBarVisible] = useState(false)

	return (
		<AppContext.Provider
			value={{
				isEditing,
				setIsEditing,
				currentNote: { noteName, setNoteName }
			}}
		>
			<div className="app-container">
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
						className="rendered-markdown"
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
					gap: "5px"
				}}
			>
				{/* <button>💾 Save</button> */}
				{/* <button>➕ New Note</button> */}
				<button onClick={() => downloadContent()}>⬇ Download</button>
			</div>
			{(!hideBottomBar || hideBottomBar !== "true") && (
				<div className={`bottom-bar ${bottomBarVisible ? "open" : "closed"}`}>
					<div className="bottom-activiation">
						<button onClick={() => setBottomBarVisible(!bottomBarVisible)}>
							{bottomBarVisible ? "v Close v" : "^ Open ^"}
						</button>
					</div>
					<div className="bottom-content">
						bottom bar content
						<br />
						sdoineoi
					</div>
				</div>
			)}
		</AppContext.Provider>
	)
}

export default App
