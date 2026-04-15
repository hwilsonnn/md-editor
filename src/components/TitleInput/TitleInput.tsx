import { useContext } from "react"
import AppContext from "../../context"
import "./TitleInput.css"

const TitleInput = () => {
	const {
		currentNote: { noteName, setNoteName },
		currentFilePath,
		isDirty
	} = useContext(AppContext)

	const isDirectoryMode = currentFilePath !== null

	return (
		<div
			style={{
				width: "100%",
				display: "flex",
				flexDirection: "column"
			}}
		>
			<input
				value={noteName ?? ""}
				className="title-input"
				placeholder="Note name"
				readOnly={isDirectoryMode}
				onInput={(e) => {
					if (!isDirectoryMode) {
						setNoteName((e.target as HTMLInputElement).value)
					}
				}}
				onBlur={() => {
					if (noteName && noteName.length > 0) {
						window.electronAPI?.setTitle(
							`${isDirty ? "● " : ""}${noteName} - Markdown Editor`
						)
					} else {
						window.electronAPI?.setTitle("Markdown Editor")
					}
				}}
			/>
		</div>
	)
}

export default TitleInput
