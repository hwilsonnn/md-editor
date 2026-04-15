import { createContext } from "react"

interface Note {
	noteName: string | null
	setNoteName: (name: string) => void
}

interface AppContextValue {
	isEditing: boolean
	setIsEditing: (isEditing: boolean) => void
	currentNote: Note
	openedDirectory: string | null
	setOpenedDirectory: (dir: string | null) => void
	currentFilePath: string | null
	setCurrentFilePath: (path: string | null) => void
	isDirty: boolean
	setIsDirty: (dirty: boolean) => void
}

const defaultValue: AppContextValue = {
	isEditing: false,
	setIsEditing: () => {},
	currentNote: {
		noteName: null,
		setNoteName: () => {}
	},
	openedDirectory: null,
	setOpenedDirectory: () => {},
	currentFilePath: null,
	setCurrentFilePath: () => {},
	isDirty: false,
	setIsDirty: () => {}
}

const AppContext = createContext<AppContextValue>(defaultValue)

export default AppContext
