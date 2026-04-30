import { onMount } from 'solid-js'
import createLocalStore from '../../libs'
import { A, useNavigate } from '@solidjs/router'
import API from '../api'
import AppIcon from '../components/AppIcon'

const Login = () => {
	const [store, setStore] = createLocalStore()
	const navigate = useNavigate()

	onMount(() => {
		if (store.access_token) {
			navigate('/')
		}
	})

	const handleSubmit = async (event) => {
		event.preventDefault()
		const data = new FormData(event.currentTarget)
		const email = data.get('email')
		const password = data.get('password')

		const tokenData = await API.auth.login(email, password)

		setStore('access_token', tokenData.access_token)
		setStore('user', { email })

		const redirect_url = store.redirect || localStorage.getItem('last_viewed_path') || '/'
		navigate(redirect_url)
	}

	return (
		<div class="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
			{/* Background Blobs */}
			<div class="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
			<div class="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]" />

			<div class="w-full max-w-md glass-panel p-8 space-y-8 animate-in fade-in zoom-in-95 duration-700 relative z-10">
				<div class="flex flex-col items-center gap-4">
					<div class="p-3 rounded-2xl bg-secondary/10 text-secondary">
						<AppIcon />
					</div>
					<div class="text-center">
						<h1 class="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
						<p class="text-white/40 text-sm mt-1">Sign in to access your secure storage</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} class="space-y-6">
					<div class="space-y-4">
						<div class="space-y-2">
							<label class="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
							<input
								name="email"
								type="email"
								required
								placeholder="name@example.com"
								class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:bg-white/10 transition-all"
							/>
						</div>
						<div class="space-y-2">
							<label class="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Password</label>
							<input
								name="password"
								type="password"
								required
								placeholder="••••••••"
								class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:bg-white/10 transition-all"
							/>
						</div>
					</div>

					<button
						type="submit"
						class="w-full bg-secondary text-primary font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-secondary/20"
					>
						Sign In
					</button>
				</form>

				<div class="text-center pt-4 border-t border-white/5">
					<p class="text-white/40 text-sm">
						Don't have an account?{' '}
						<A href="/register" class="text-secondary hover:underline font-medium">
							Create one for free
						</A>
					</p>
				</div>
			</div>
		</div>
	)
}

export default Login
