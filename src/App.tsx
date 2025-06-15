import { DragEvent, useCallback, useEffect, useState } from "react"
import "./App.css"
import "./prism.css"
import "./formattedMarkdown.css"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"

import "prism-react-editor/prism/languages/markdown"
// import "prism-react-editor/prism/languages/typescript"

import {
	downloadTxtFile,
	generateTableOfContents,
	handleFileDrop
} from "./utils"
import AppContext from "./context"
import TitleInput from "./components/TitleInput"

function App() {
	const [savedValue, setSavedValue] = useState("")
	const [content, setContent] = useState("")
	const [isEditing, setIsEditing] = useState(true)
	const [noteName, setNoteName] = useState("")
	const [isDragging, setIsDragging] = useState(false)

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
		if (!window.confirm("Are you sure you want to leave the page?")) {
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
			history.pushState(null, "", window.location.origin)
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

	const handleDragOver = useCallback(
		(e: DragEvent<HTMLElement>, isDragging: boolean) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragging(isDragging)
		},
		[]
	)

	const handleDrop = useCallback(
		(e: DragEvent<HTMLElement>) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragging(false)

			handleFileDrop(
				e.dataTransfer.files,
				(fileContent: string) => {
					setContent(fileContent)
					setSavedValue(fileContent)
					setIsEditing(false)
				},
				setNoteName
			)
		},
		[setSavedValue, setContent]
	)

	return (
		<AppContext.Provider
			value={{
				isEditing,
				setIsEditing,
				currentNote: { noteName, setNoteName }
			}}
		>
			<main
				className={`app-container ${isDragging ? "dragging" : ""}`}
				onDragOver={(e) => handleDragOver(e, true)}
				onDragLeave={(e) => handleDragOver(e, false)}
				onDrop={handleDrop}
			>
				<div className="title-bar">
					<TitleInput />
					{!isEditing && (
						<button
							style={{
								whiteSpace: "nowrap"
							}}
							onClick={() => generateTableOfContents()}
						>
							☰ Contents
						</button>
					)}
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
					<>
						<div
							id="my-markdown-area"
							className="rendered-markdown"
							onClick={(e) => {
								if (!(e.target instanceof HTMLAnchorElement)) {
									setIsEditing(true)
								}
							}}
						>
							<div id="table-of-contents"></div>
							<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
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
					{content.length === 0
						? 0
						: content.split(/\s|\\n/).filter((word) => word !== "").length}{" "}
					words
				</span>
				<button onClick={() => downloadContent()}>⬇ Download</button>
			</div>
		</AppContext.Provider>
	)
}

export default App
