import { createSignal, For, onMount, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import ArrowBackIcon from '@suid/icons-material/ArrowBack'
import HelpOutlineIcon from '@suid/icons-material/HelpOutline'
import EngineeringIcon from '@suid/icons-material/Engineering'
import API from '../../api'
import { alertStore } from '../../components/AlertStack'

const StorageWorkerCreateForm = () => {
	const [storages, setStorages] = createSignal([])
	const { addAlert } = alertStore
	const navigate = useNavigate()

	onMount(async () => {
		const storagesSchema = await API.storages.listStorages()
		setStorages(storagesSchema.storages)
	})

	const handleSubmit = async (event) => {
		event.preventDefault()
		const data = new FormData(event.currentTarget)
		const name = data.get('name')
		const token = data.get('token')
		const storageId = data.get('storage_id')

		await API.storageWorkers.createStorageWorker(name, token, storageId)
		addAlert(`Created storage worker "${name}"`, 'success')
		navigate('/storage_workers')
	}

	return (
		<div class="max-w-xl mx-auto space-y-10 py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
			<div class="flex items-center justify-between">
				<button 
					onClick={() => navigate('/storage_workers')}
					class="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all active:scale-90"
				>
					<ArrowBackIcon />
				</button>
				<a 
					href="https://github.com/Dominux/Pentaract/wiki/Creating-storage-workers" 
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
					<EngineeringIcon sx={{ fontSize: 200 }} />
				</div>

				<div class="text-center">
					<h1 class="text-3xl font-black text-white tracking-tighter uppercase italic">Deploy Worker</h1>
					<p class="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Connect a new processing engine with token</p>
				</div>

				<form onSubmit={handleSubmit} class="space-y-8 relative z-10">
					<div class="space-y-6">
						<div class="space-y-2">
							<label class="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Worker Name</label>
							<input
								name="name"
								required
								placeholder="e.g. WORKER-01-PRIMARY"
								class="w-full bg-white/[0.05] border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-white/10 transition-all font-mono text-sm"
							/>
						</div>

						<div class="space-y-2">
							<label class="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Access Token</label>
							<input
								name="token"
								required
								placeholder="Paste secure token here..."
								class="w-full bg-white/[0.05] border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-white/10 transition-all font-mono text-sm"
							/>
						</div>

						<div class="space-y-2">
							<label class="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">Target Storage Cluster</label>
							<select
								name="storage_id"
								required
								class="w-full bg-white/[0.05] border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-white/10 transition-all font-mono text-sm appearance-none cursor-pointer"
							>
								<option value="" disabled selected class="bg-[#030303] text-white/40">Select a storage node...</option>
								<For each={storages()}>
									{(storage) => (
										<option value={storage.id} class="bg-[#030303] text-white">{storage.name}</option>
									)}
								</For>
							</select>
						</div>
					</div>

					<button
						type="submit"
						class="w-full bg-secondary text-primary font-black py-5 rounded-2xl hover:glow-secondary transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
					>
						Deploy Worker Node
					</button>
				</form>
			</div>
		</div>
	)
}

export default StorageWorkerCreateForm
