import { useContext } from "react"
import AppContext from "../../context"
import "./TitleInput.css"

const TitleInput = () => {
	const {
		currentNote: { noteName, setNoteName }
	} = useContext(AppContext)

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
				onInput={(e) => setNoteName((e.target as HTMLInputElement).value)}
				onBlur={() => {
					if (noteName && noteName.length > 0) {
						document.title = `${noteName} - Markdown Editor`
					} else {
						document.title = "Markdown Editor"
					}
				}}
			/>
		</div>
	)
}

export default TitleInput
