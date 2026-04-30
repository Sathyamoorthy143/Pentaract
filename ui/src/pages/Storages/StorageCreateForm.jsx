import { createSignal, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import ArrowBackIcon from '@suid/icons-material/ArrowBack'
import HelpOutlineIcon from '@suid/icons-material/HelpOutline'
import StorageIcon from '@suid/icons-material/Storage'
import API from '../../api'
import { alertStore } from '../../components/AlertStack'

const StorageCreateForm = () => {
	const [chatIdErr, setChatIdErr] = createSignal(null)
	const { addAlert } = alertStore
	const navigate = useNavigate()

	const handleSubmit = async (event) => {
		event.preventDefault()
		const data = new FormData(event.currentTarget)
		const name = data.get('name')
		const chatId = parseInt(data.get('chat_id'))

		await API.storages.createStorage(name, chatId)
		addAlert(`Created storage "${name}"`, 'success')
		navigate('/storages')
	}

	const validateChatId = (event) => {
		const value = event.currentTarget.value
		let err = null
		if (value > 0) {
			err = 'Chat id must be a valid negative integer'
		} else if (value === '') {
			err = 'Chat id is required'
		}
		setChatIdErr(err)
	}

	return (
		<div class="max-w-xl mx-auto space-y-10 py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
			<div class="flex items-center justify-between">
				<button 
					onClick={() => navigate('/storages')}
					class="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all active:scale-90"
				>
					<ArrowBackIcon />
				</button>
				<a 
					href="https://github.com/Dominux/Pentaract/wiki/Creating-storages" 
					target="_blank"
					class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary hover:underline"
				>
					Documentation
					<HelpOutlineIcon sx={{ fontSize: 16 }} />
				</a>
			</div>

			<div class="glass-panel p-10 space-y-8 relative overflow-hidden">
				{/* Decorative Background */}
				<div class="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none">
					<StorageIcon sx={{ fontSize: 200 }} />
				</div>

				<div class="text-center">
					<h1 class="text-3xl font-black text-white tracking-tighter uppercase italic">Initialize Node</h1>
					<p class="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Connect a new Telegram-backed data cluster</p>
				</div>

				<form onSubmit={handleSubmit} class="space-y-8 relative z-10">
					<div class="space-y-6">
						<div class="space-y-2">
							<label class="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Cluster Name</label>
							<input
								name="name"
								required
								placeholder="e.g. ALPHA-CENTAURI"
								class="w-full bg-white/[0.05] border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-white/10 transition-all font-mono text-sm"
							/>
						</div>

						<div class="space-y-2">
							<label class="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Telegram Chat ID</label>
							<input
								name="chat_id"
								type="number"
								required
								onInput={validateChatId}
								placeholder="-100123456789"
								class={`w-full bg-white/[0.05] border rounded-2xl px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all font-mono text-sm ${
									chatIdErr() ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/20 focus:ring-secondary/40 focus:bg-white/10'
								}`}
							/>
							<Show when={chatIdErr()}>
								<p class="text-[10px] text-red-400 font-bold uppercase tracking-widest ml-1">{chatIdErr()}</p>
							</Show>
						</div>
					</div>

					<button
						type="submit"
						disabled={chatIdErr() !== null}
						class="w-full bg-secondary text-primary font-black py-5 rounded-2xl hover:glow-secondary transition-all active:scale-[0.98] disabled:opacity-30 disabled:hover:glow-none uppercase tracking-widest text-xs"
					>
						Authorize Registration
					</button>
				</form>
			</div>
		</div>
	)
}

export default StorageCreateForm
