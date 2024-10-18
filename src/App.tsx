import { useEffect, useState } from "react"
import "./App.css"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

function App() {
	const [content, setContent] = useState("")
	const [isEditing, setIsEditing] = useState(true)

	const clickCallback = (e: MouseEvent) => {
		console.log("called")
		if (e.target && e.target?.id !== "my-text-area" && isEditing)
			setIsEditing(false)
		else if (e.target && e.target?.id === "my-markdown-area") setIsEditing(true)
	}

	document.addEventListener("click", clickCallback)

	return (
		<div style={{ height: "90dvh", width: "60dvw" }}>
			{isEditing && (
				<textarea
					id="my-text-area"
					value={content}
					style={{ height: "100%", width: "100%" }}
					onKeyDown={(e) => {
						if (e.code === "Escape") setIsEditing(false)
						if (e.code === "Tab") e.preventDefault()
					}}
					onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
				/>
			)}
			{!isEditing && (
				<div
					id="my-markdown-area"
					style={{ height: "100%", width: "100%", textAlign: "left" }}
				>
					<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
				</div>
			)}
		</div>
	)
}

export default App
