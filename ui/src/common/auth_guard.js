import { useLocation, useNavigate } from '@solidjs/router'
import createLocalStore from '../../libs'

export function checkAuth() {
	const [store, setStore] = createLocalStore()
	const navigate = useNavigate()
	const location = useLocation()

	// Save current location as "Memory"
	if (location.pathname !== '/login' && location.pathname !== '/register') {
		localStorage.setItem('last_viewed_path', location.pathname)
	}

	if (!store.access_token) {
		setStore('redirect', location.pathname)
		navigate('/login')
	}
}
