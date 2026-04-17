import {
	app,
	BrowserWindow,
	dialog,
	IpcMainEvent,
	IpcMainInvokeEvent,
	ipcMain,
	Menu,
	MenuItemConstructorOptions,
	MessageBoxOptions,
	net,
	protocol,
	shell
} from "electron"
import path from "path"
import fs from "fs/promises"
import Store from "electron-store"
import { isPathWithin } from "./security"

const store = new Store<{ recentDirectories: string[] }>({
	defaults: { recentDirectories: [] }
})

let mainWindow: BrowserWindow | null = null
let currentDirectory: string | null = null

const MARKDOWN_EXTENSIONS = [".md", ".txt", ".markdown"]

interface FileTreeNode {
	name: string
	path: string
	isDirectory: boolean
	children?: FileTreeNode[]
}

async function listFilesRecursive(dirPath: string): Promise<FileTreeNode[]> {
	const entries = await fs.readdir(dirPath, { withFileTypes: true })
	const nodes: FileTreeNode[] = []

	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name)

		if (entry.name.startsWith(".")) continue

		if (entry.isDirectory()) {
			const children = await listFilesRecursive(fullPath)
			if (children.length > 0) {
				nodes.push({
					name: entry.name,
					path: fullPath,
					isDirectory: true,
					children
				})
			}
		} else {
			nodes.push({
				name: entry.name,
				path: fullPath,
				isDirectory: false
			})
		}
	}

	nodes.sort((a, b) => {
		if (a.isDirectory && !b.isDirectory) return -1
		if (!a.isDirectory && b.isDirectory) return 1
		return a.name.localeCompare(b.name)
	})

	return nodes
}

function buildMenu(): void {
	const isMac = process.platform === "darwin"

	const template: MenuItemConstructorOptions[] = [
		{
			label: "File",
			submenu: [
				{
					label: "Open Directory",
					accelerator: "CmdOrCtrl+O",
					click: () =>
						mainWindow?.webContents.send("menu-action", "open-directory")
				},
				{
					label: "New File",
					accelerator: "CmdOrCtrl+N",
					click: () => mainWindow?.webContents.send("menu-action", "new-file")
				},
				{ type: "separator" },
				{
					label: "Save",
					accelerator: "CmdOrCtrl+S",
					click: () => mainWindow?.webContents.send("menu-action", "save")
				},
				{
					label: "Save As...",
					accelerator: "CmdOrCtrl+Shift+S",
					click: () => mainWindow?.webContents.send("menu-action", "save-as")
				},
				{ type: "separator" },
				{
					label: "Close Directory",
					click: () =>
						mainWindow?.webContents.send("menu-action", "close-directory")
				},
				{ type: "separator" },
				isMac ? { role: "close" } : { role: "quit" }
			]
		},
		{
			label: "Edit",
			submenu: [
				{ role: "undo" },
				{ role: "redo" },
				{ type: "separator" },
				{ role: "cut" },
				{ role: "copy" },
				{ role: "paste" },
				{ role: "selectAll" }
			]
		},
		{
			label: "View",
			submenu: [
				{
					label: "Toggle Edit/Preview",
					click: () =>
						mainWindow?.webContents.send("menu-action", "toggle-view")
				},
				{ type: "separator" },
				...(app.isPackaged ? [] : [{ role: "toggleDevTools" as const }]),
				{ role: "resetZoom" as const },
				{ role: "zoomIn" as const },
				{ role: "zoomOut" as const },
				{ type: "separator" as const },
				{ role: "togglefullscreen" as const }
			]
		}
	]

	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
}

function createWindow(): void {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		title: "Markdown Editor",
		webPreferences: {
			preload: path.join(__dirname, "../preload/index.mjs"),
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: false
		}
	})

	mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
		shell.openExternal(url)
		return { action: "deny" }
	})

	mainWindow.webContents.openDevTools()

	if (process.env.ELECTRON_RENDERER_URL) {
		mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
	} else {
		mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"))
	}

	mainWindow.on("closed", () => {
		mainWindow = null
	})
}

// --- IPC Handlers ---

// Directory operations
ipcMain.handle("open-directory", async () => {
	const result = await dialog.showOpenDialog(mainWindow!, {
		properties: ["openDirectory"]
	})
	if (result.canceled || result.filePaths.length === 0) return null
	const dirPath = result.filePaths[0]
	currentDirectory = dirPath
	return dirPath
})

ipcMain.handle(
	"list-files",
	async (_event: IpcMainInvokeEvent, dirPath: string) => {
		try {
			return await listFilesRecursive(dirPath)
		} catch {
			return []
		}
	}
)

// File operations
ipcMain.handle(
	"read-file",
	async (_event: IpcMainInvokeEvent, filePath: string) => {
		if (currentDirectory && !isPathWithin(filePath, currentDirectory)) {
			throw new Error("Access denied: file is outside the opened directory")
		}
		return await fs.readFile(filePath, "utf-8")
	}
)

ipcMain.handle(
	"save-file",
	async (_event: IpcMainInvokeEvent, filePath: string, content: string) => {
		if (currentDirectory && !isPathWithin(filePath, currentDirectory)) {
			throw new Error("Access denied: file is outside the opened directory")
		}
		await fs.writeFile(filePath, content, "utf-8")
		return true
	}
)

ipcMain.handle(
	"save-file-as",
	async (_event: IpcMainInvokeEvent, content: string, defaultName: string) => {
		const result = await dialog.showSaveDialog(mainWindow!, {
			defaultPath: defaultName || "untitled.md",
			filters: [
				{ name: "Markdown", extensions: ["md", "markdown"] },
				{ name: "Text", extensions: ["txt"] },
				{ name: "All Files", extensions: ["*"] }
			]
		})
		if (result.canceled || !result.filePath) return null
		await fs.writeFile(result.filePath, content, "utf-8")
		return result.filePath
	}
)

ipcMain.handle(
	"create-file",
	async (_event: IpcMainInvokeEvent, dirPath: string, fileName: string) => {
		if (currentDirectory && !isPathWithin(dirPath, currentDirectory)) {
			throw new Error("Access denied: path is outside the opened directory")
		}

		const filePath = path.join(dirPath, fileName)
		try {
			await fs.access(filePath)
			throw new Error(`File "${fileName}" already exists`)
		} catch (err: unknown) {
			if (
				err instanceof Error &&
				"code" in err &&
				(err as NodeJS.ErrnoException).code === "ENOENT"
			) {
				await fs.writeFile(filePath, "", "utf-8")
				return filePath
			}
			throw err
		}
	}
)

ipcMain.handle(
	"delete-file",
	async (_event: IpcMainInvokeEvent, filePath: string) => {
		if (currentDirectory && !isPathWithin(filePath, currentDirectory)) {
			throw new Error("Access denied: file is outside the opened directory")
		}

		const result = await dialog.showMessageBox(mainWindow!, {
			type: "warning",
			buttons: ["Delete", "Cancel"],
			defaultId: 1,
			title: "Delete File",
			message: `Are you sure you want to delete "${path.basename(filePath)}"?`
		})

		if (result.response === 0) {
			await fs.unlink(filePath)
			return true
		}
		return false
	}
)

ipcMain.handle(
	"show-message-box",
	async (_event: IpcMainInvokeEvent, options: MessageBoxOptions) => {
		const result = await dialog.showMessageBox(mainWindow!, options)
		return result.response
	}
)

// Recent directories
ipcMain.handle("get-recent-dirs", () => {
	return store.get("recentDirectories", [])
})

ipcMain.handle(
	"add-recent-dir",
	(_event: IpcMainInvokeEvent, dirPath: string) => {
		const recent = store.get("recentDirectories", [])
		const filtered = recent.filter((d: string) => d !== dirPath)
		const updated = [dirPath, ...filtered].slice(0, 10)
		store.set("recentDirectories", updated)
		return updated
	}
)

ipcMain.handle(
	"remove-recent-dir",
	(_event: IpcMainInvokeEvent, dirPath: string) => {
		const recent = store.get("recentDirectories", [])
		const updated = recent.filter((d: string) => d !== dirPath)
		store.set("recentDirectories", updated)
		return updated
	}
)

// Window title
ipcMain.on("set-title", (_event: IpcMainEvent, title: string) => {
	mainWindow?.setTitle(title)
})

// --- App lifecycle ---

protocol.registerSchemesAsPrivileged([
	{
		scheme: "md-asset",
		privileges: {
			standard: true,
			secure: true,
			supportFetchAPI: true,
			bypassCSP: false,
			stream: true
		}
	}
])

app.whenReady().then(() => {
	protocol.handle("md-asset", (request) => {
		// Chromium parses md-asset:///C:/path as host="c", pathname="/path"
		// Reconstruct the full path from host (drive letter) + pathname
		const url = new URL(request.url)
		const filePath = `${url.host.toUpperCase()}:${decodeURIComponent(url.pathname)}`
		console.log("[md-asset] request:", request.url, "-> filePath:", filePath)
		// Security: only serve files within the current open directory
		if (currentDirectory && !isPathWithin(filePath, currentDirectory)) {
			console.warn("[md-asset] forbidden:", filePath)
			return new Response("Forbidden", { status: 403 })
		}
		return net.fetch(`file:///${filePath}`)
	})

	buildMenu()
	createWindow()

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit()
	}
})
