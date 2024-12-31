import { useContext } from "react"
import AppContext from "./context"

const NameInput = () => {
	const {
		isEditing,
		currentNote: { noteName, setNoteName },
	} = useContext(AppContext)

	return (
		<div
			style={{
				paddingLeft: isEditing ? "12px" : "0",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				marginBottom: isEditing ? "8px" : "0",
			}}
		>
			<input
				value={noteName ?? ""}
				className="title-input"
				placeholder="Note name"
				onInput={(e) => setNoteName((e.target as HTMLInputElement).value)}
				onBlur={() => {
					if (noteName && noteName.length > 0) {
						document.title = `${noteName} - Markdown Editor`
					}
				}}
			/>
		</div>
	)
}

export default NameInput
