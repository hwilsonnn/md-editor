import { contextBridge, ipcRenderer } from "electron"

const electronAPI = {
	openDirectory: (): Promise<string | null> =>
		ipcRenderer.invoke("open-directory"),
	listFiles: (dirPath: string): Promise<FileTreeNode[]> =>
		ipcRenderer.invoke("list-files", dirPath),
	readFile: (filePath: string): Promise<string> =>
		ipcRenderer.invoke("read-file", filePath),
	saveFile: (filePath: string, content: string): Promise<boolean> =>
		ipcRenderer.invoke("save-file", filePath, content),
	saveFileAs: (content: string, defaultName: string): Promise<string | null> =>
		ipcRenderer.invoke("save-file-as", content, defaultName),
	createFile: (dirPath: string, fileName: string): Promise<string> =>
		ipcRenderer.invoke("create-file", dirPath, fileName),
	deleteFile: (filePath: string): Promise<boolean> =>
		ipcRenderer.invoke("delete-file", filePath),
	showMessageBox: (options: {
		type?: string
		buttons?: string[]
		defaultId?: number
		title?: string
		message: string
	}): Promise<number> => ipcRenderer.invoke("show-message-box", options),
	getRecentDirectories: (): Promise<string[]> =>
		ipcRenderer.invoke("get-recent-dirs"),
	addRecentDirectory: (dirPath: string): Promise<string[]> =>
		ipcRenderer.invoke("add-recent-dir", dirPath),
	removeRecentDirectory: (dirPath: string): Promise<string[]> =>
		ipcRenderer.invoke("remove-recent-dir", dirPath),
	setTitle: (title: string): void => ipcRenderer.send("set-title", title),
	copyFile: (sourcePath: string, destPath: string): Promise<string> =>
		ipcRenderer.invoke("copy-file", sourcePath, destPath),
	createDirectory: (dirPath: string, dirName: string): Promise<string> =>
		ipcRenderer.invoke("create-directory", dirPath, dirName),
	moveFile: (sourcePath: string, targetDir: string): Promise<string> =>
		ipcRenderer.invoke("move-file", sourcePath, targetDir),
	readFileBase64: (filePath: string): Promise<string> =>
		ipcRenderer.invoke("read-file-base64", filePath),
	onMenuAction: (callback: (action: string) => void): (() => void) => {
		const handler = (_event: Electron.IpcRendererEvent, action: string) =>
			callback(action)
		ipcRenderer.on("menu-action", handler)
		return () => ipcRenderer.removeListener("menu-action", handler)
	}
}

export interface FileTreeNode {
	name: string
	path: string
	isDirectory: boolean
	children?: FileTreeNode[]
}

contextBridge.exposeInMainWorld("electronAPI", electronAPI)

export type ElectronAPI = typeof electronAPI
