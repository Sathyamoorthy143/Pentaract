import { Show, createSignal, For, onMount } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import StorageIcon from '@suid/icons-material/Storage'
import AddIcon from '@suid/icons-material/Add'
import FolderOpenIcon from '@suid/icons-material/FolderOpen'
import API from '../../api'
import { convertSize } from '../../common/size_converter'

const Storages = () => {
	const [storages, setStorages] = createSignal([])
	const navigate = useNavigate()

	onMount(async () => {
		// 1. Instant Recall from Cache
		const cached = localStorage.getItem('cache_storages')
		if (cached) {
			try { setStorages(JSON.parse(cached)) } catch {}
		}

		// 2. Background Verification
		const res = await API.storages.listStorages()
		const list = res?.storages || (Array.isArray(res) ? res : [])
		setStorages(list)
		
		// 3. Update Memory
		localStorage.setItem('cache_storages', JSON.stringify(list))
	})

	return (
		<div class="max-w-7xl mx-auto space-y-12 py-6">
			<div class="flex items-end justify-between px-2">
				<div class="space-y-1">
					<h1 class="text-5xl font-black tracking-tighter text-white uppercase italic">
						Drives
					</h1>
					<p class="text-white/60 text-sm font-medium tracking-widest uppercase">
						Infrastructure status & connectivity
					</p>
				</div>
				<button
					onClick={() => navigate('/storages/register')}
					class="group relative flex items-center gap-2 bg-secondary text-primary font-bold px-8 py-4 rounded-2xl hover:glow-secondary transition-all active:scale-95 overflow-hidden"
				>
					<div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
					<AddIcon class="relative z-10" />
					<span class="relative z-10 uppercase tracking-tight">Register Drive</span>
				</button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<Show 
					when={storages().length > 0} 
					fallback={
						<div class="col-span-full py-32 glass-panel flex flex-col items-center justify-center text-white/40 border-dashed">
							<FolderOpenIcon sx={{ fontSize: 80, mb: 3, opacity: 0.2 }} />
							<p class="text-2xl font-bold tracking-tight text-white/50 uppercase">No Data Nodes Found</p>
							<p class="text-sm tracking-wide text-white/40">Initialize a new storage cluster to begin.</p>
						</div>
					}
				>
					<For each={storages()}>
						{(storage, i) => (
							<div 
								onClick={() => navigate(`/storages/${storage.id}/files`)}
								class="glass-card group p-8 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[280px] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out"
								style={{ "animation-delay": `${i() * 150}ms` }}
							>
								{/* Decorative Background Icon */}
								<div class="absolute -right-4 -top-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700">
									<StorageIcon sx={{ fontSize: 160 }} />
								</div>

								<div class="relative z-10">
									<div class="flex items-center justify-between mb-8">
										<div class="p-4 rounded-2xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500 shadow-inner">
											<StorageIcon sx={{ fontSize: 32 }} />
										</div>
										<div class="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-widest">
											Active Node
										</div>
									</div>

									<h3 class="text-2xl font-black text-white mb-2 group-hover:text-secondary transition-colors tracking-tight line-clamp-1">
										{storage.name}
									</h3>
									<p class="text-white/50 text-xs font-mono mb-8 tracking-tighter uppercase">{storage.chat_id}</p>
								</div>

								<div class="relative z-10 space-y-4">
									<div class="flex justify-between items-end">
										<div class="flex flex-col">
											<span class="text-[10px] font-bold uppercase tracking-widest text-white/60">Capacity</span>
											<span class="text-lg font-mono font-bold text-white">{convertSize(storage.size)}</span>
										</div>
										<div class="text-right flex flex-col">
											<span class="text-[10px] font-bold uppercase tracking-widest text-white/60">Objects</span>
											<span class="text-lg font-mono font-bold text-white">{storage.files_amount}</span>
										</div>
									</div>
									<div class="h-1 w-full bg-white/20 rounded-full overflow-hidden">
										<div 
											class="h-full bg-secondary shadow-[0_0_10px_rgba(249,233,0,0.5)] transition-all duration-1000 ease-out" 
											style={{ width: `${Math.min((storage.size / 1000000000) * 100, 100)}%` }} 
										/>
									</div>
								</div>
							</div>
						)}
					</For>
				</Show>
			</div>
		</div>
	)
}

export default Storages
