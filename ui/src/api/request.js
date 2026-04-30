import { alertStore } from '../components/AlertStack'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

/**
 * @typedef {'get' | 'post' | 'patch' | 'delete'} Method
 */

/**
 *
 * @param {string} path
 * @param {Method} method
 * @param {string | null | undefined} auth_token
 * @param {any} body
 * @param {boolean} return_response
 * @returns
 */
const apiRequest = async (
	path,
	method,
	auth_token,
	body,
	return_response = false
) => {
	const { addAlert } = alertStore

	const fullpath = `${API_BASE}${path}`

	const headers = new Headers()
	headers.append('Content-Type', 'application/json')
	if (auth_token) {
		headers.append('Authorization', auth_token)
	}

	try {
		const response = await fetch(fullpath, {
			method,
			body: JSON.stringify(body),
			headers,
		})

		if (!response.ok) {
			throw new Error(await response.text())
		}

		if (return_response) {
			return response
		}

		try {
			return await response.json()
		} catch {}
	} catch (err) {
		addAlert(err.message, 'error')

		throw err
	}
}

/**
 *
 * @param {string} path
 * @param {string | null | undefined} auth_token
 * @param {FormData} form
 * @param {Function} onProgress
 * @returns
 */
export const apiMultipartRequest = async (path, auth_token, form, onProgress) => {
	const { addAlert } = alertStore
	const fullpath = `${API_BASE}${path}`

	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()
		xhr.open('POST', fullpath)

		if (auth_token) {
			xhr.setRequestHeader('Authorization', auth_token)
		}

		if (onProgress && xhr.upload) {
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable) {
					onProgress({
						loaded: e.loaded,
						total: e.total,
						percentage: Math.round((e.loaded / e.total) * 100),
					})
				}
			}
		}

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				try {
					resolve(JSON.parse(xhr.responseText))
				} catch {
					resolve(null)
				}
			} else {
				const err = xhr.responseText || 'Upload failed'
				addAlert(err, 'error')
				reject(new Error(err))
			}
		}

		xhr.onerror = () => {
			addAlert('Network error during upload', 'error')
			reject(new Error('Network error'))
		}

		xhr.send(form)
	})
}

export default apiRequest
