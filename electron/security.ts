import path from "path"

/**
 * Validates that a file path is within an allowed directory.
 * Prevents path traversal attacks.
 */
export function isPathWithin(filePath: string, allowedDir: string): boolean {
	const resolvedPath = path.resolve(filePath)
	const resolvedDir = path.resolve(allowedDir)
	return (
		resolvedPath.startsWith(resolvedDir + path.sep) ||
		resolvedPath === resolvedDir
	)
}
