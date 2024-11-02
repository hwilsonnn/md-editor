let request: IDBOpenDBRequest
let db: IDBDatabase
let version = 1

export interface Note {
	id: string
	title: string
	noteContent: string
}

export enum Stores {
	Notes = "Notes",
}

export const initDb = (): Promise<boolean> =>
	new Promise((resolve) => {
		request = indexedDB.open("mdEditor")

		request.onupgradeneeded = () => {
			db = request.result

			if (!db.objectStoreNames.contains(Stores.Notes)) {
				console.log("creating Notes store")
				db.createObjectStore(Stores.Notes, { keyPath: "id" })
			}
		}

		request.onsuccess = () => {
			db = request.result
			version = db.version
			console.log("request.onsuccess - initDB", version)
			resolve(true)
		}

		request.onerror = () => {
			resolve(false)
		}
	})
