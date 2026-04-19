export interface FileTreeNode {
	name: string
	path: string
	isDirectory: boolean
	children?: FileTreeNode[]
}

export interface ElectronAPI {
	openDirectory: () => Promise<string | null>
	listFiles: (dirPath: string) => Promise<FileTreeNode[]>
	readFile: (filePath: string) => Promise<string>
	saveFile: (filePath: string, content: string) => Promise<boolean>
	saveFileAs: (content: string, defaultName: string) => Promise<string | null>
	createFile: (dirPath: string, fileName: string) => Promise<string>
	deleteFile: (filePath: string) => Promise<boolean>
	showMessageBox: (options: {
		type?: string
		buttons?: string[]
		defaultId?: number
		title?: string
		message: string
	}) => Promise<number>
	getRecentDirectories: () => Promise<string[]>
	addRecentDirectory: (dirPath: string) => Promise<string[]>
	removeRecentDirectory: (dirPath: string) => Promise<string[]>
	setTitle: (title: string) => void
	copyFile: (sourcePath: string, destPath: string) => Promise<string>
	createDirectory: (dirPath: string, dirName: string) => Promise<string>
	moveFile: (sourcePath: string, targetDir: string) => Promise<string>
	readFileBase64: (filePath: string) => Promise<string>
	onMenuAction: (callback: (action: string) => void) => () => void
}

declare global {
	interface Window {
		electronAPI: ElectronAPI
	}
}
