import { createContext } from "react"

interface Note {
	noteName: string | null
	setNoteName: (name: string) => void
}

interface AppContextValue {
	isEditing: boolean
	setIsEditing: (isEditing: boolean) => void
	currentNote: Note
}

const defaultValue: AppContextValue = {
	isEditing: false,
	setIsEditing: () => {},
	currentNote: {
		noteName: null,
		setNoteName: () => {}
	}
}

const AppContext = createContext<AppContextValue>(defaultValue)

export default AppContext
