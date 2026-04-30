import AppBar from '@suid/material/AppBar'
import Toolbar from '@suid/material/Toolbar'
import Typography from '@suid/material/Typography'
import IconButton from '@suid/material/IconButton'
import { A, useNavigate } from '@solidjs/router'
import LogoutIcon from '@suid/icons-material/Logout'
import Box from '@suid/material/Box'

import AppIcon from './AppIcon'
import createLocalStore from '../../libs'

const Header = () => {
	// BUG FIX #5: Destructure all 4 return values so we can call removeItem (3rd value).
	// Previously only [store, setStore] was destructured.  Calling setStore('access_token')
	// with no second arg passes `undefined`, which JSON.stringify turns into the literal
	// string "undefined" in localStorage.  JSON.parse("undefined") then throws, so the
	// catch-block returns `undefined` — which happens to be falsy and auth still works,
	// but it leaves stale junk in localStorage and is semantically wrong.
	// Using the dedicated remover function is the correct API.
	const [_store, setStore, removeItem] = createLocalStore()
	const navigate = useNavigate()

	const logout = (_) => {
		// Remove the token entry completely instead of setting it to undefined
		removeItem('access_token')
		// Reset the redirect so after the next login we go to '/' not back to some stale page
		setStore('redirect', '/')

		navigate('/login')
	}

	return (
		<AppBar>
			<Toolbar sx={{ justifyContent: 'space-between' }}>
				<A href="/">
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<AppIcon />
						<Typography variant="h4" noWrap sx={{ pl: 1.5 }}>
							Pentaract
						</Typography>
					</Box>
				</A>

				<IconButton onClick={logout}>
					<LogoutIcon sx={{ color: 'white' }} />
				</IconButton>
			</Toolbar>
		</AppBar>
	)
}

export default Header
