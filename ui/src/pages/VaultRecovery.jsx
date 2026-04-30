import { createSignal, onMount } from 'solid-js'
import { useSearchParams, useNavigate } from '@solidjs/router'
import API from '../api'
import { alertStore } from '../components/AlertStack'
import SecurityIcon from '@suid/icons-material/Security'
import VpnKeyIcon from '@suid/icons-material/VpnKey'

const VaultRecovery = () => {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const { addAlert } = alertStore
	const [newPassword, setNewPassword] = createSignal('')
	const [confirmPassword, setConfirmPassword] = createSignal('')
	const [loading, setLoading] = createSignal(false)

	const handleReset = async (e) => {
		e.preventDefault()
		if (newPassword() !== confirmPassword()) {
			addAlert('Passwords do not match', 'error')
			return
		}

		setLoading(true)
		try {
			// Extract token from URL
			const token = searchParams.token
			if (!token) throw new Error('Invalid or missing recovery token')

			await API.apiRequest('/users/master_password/reset_confirm', 'post', null, {
				token,
				new_password: newPassword()
			})

			addAlert('Vault Re-Keyed Successfully', 'success')
			navigate('/storages')
		} catch (err) {
			addAlert('Recovery token expired or invalid', 'error')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div class="min-h-screen flex items-center justify-center p-6 bg-[#0D1821]">
			<div class="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-700">
				<div class="text-center space-y-4">
					<div class="inline-flex p-6 bg-secondary/10 rounded-full text-secondary shadow-[0_0_50px_rgba(249,233,0,0.1)]">
						<SecurityIcon sx={{ fontSize: 64 }} />
					</div>
					<h1 class="text-4xl font-black text-white tracking-tighter uppercase italic">Vault Recovery</h1>
					<p class="text-white/40 text-xs font-bold uppercase tracking-widest">Sector decryption re-authorization terminal</p>
				</div>

				<form onSubmit={handleReset} class="glass-panel p-8 space-y-6 border-white/5 shadow-2xl">
					<div class="space-y-4">
						<div class="space-y-1">
							<label class="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">New Master Key</label>
							<div class="relative">
								<VpnKeyIcon class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" sx={{ fontSize: 18 }} />
								<input 
									type="password" 
									required
									placeholder="••••••••"
									class="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all font-mono"
									onInput={(e) => setNewPassword(e.target.value)}
								/>
							</div>
						</div>

						<div class="space-y-1">
							<label class="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Confirm New Key</label>
							<div class="relative">
								<VpnKeyIcon class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" sx={{ fontSize: 18 }} />
								<input 
									type="password" 
									required
									placeholder="••••••••"
									class="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all font-mono"
									onInput={(e) => setConfirmPassword(e.target.value)}
								/>
							</div>
						</div>
					</div>

					<button 
						type="submit" 
						disabled={loading()}
						class="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-secondary transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
					>
						<Show when={loading()} fallback="RE-KEY VAULT">
							<div class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
							PROCESSING...
						</Show>
					</button>
				</form>

				<p class="text-center text-white/20 text-[10px] font-bold uppercase tracking-widest">
					Warning: Master encryption keys are zero-knowledge. Resetting will invalidate all current vault sessions.
				</p>
			</div>
		</div>
	)
}

export default VaultRecovery
