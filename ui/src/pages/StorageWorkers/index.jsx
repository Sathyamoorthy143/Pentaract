import { Show, createSignal, For, onMount } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import SpeedIcon from '@suid/icons-material/Speed'
import AddIcon from '@suid/icons-material/Add'
import ContentCopyIcon from '@suid/icons-material/ContentCopy'
import API from '../../api'
import { alertStore } from '../../components/AlertStack'

const StorageWorkers = () => {
	const [storageWorkers, setStorageWorkers] = createSignal([])
	const navigate = useNavigate()
	const { addAlert } = alertStore

	onMount(async () => {
		const res = await API.storageWorkers.listStorageWorkers()
		setStorageWorkers(Array.isArray(res) ? res : res?.storage_workers || [])
	})

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text)
		addAlert('Token copied to clipboard', 'success')
	}

	return (
		<div class="max-w-7xl mx-auto space-y-10 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
			{/* Header */}
			<div class="glass-panel p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-white/[0.03]">
				<div class="flex items-center gap-6">
					<div class="p-4 rounded-2xl bg-secondary/10 text-secondary glow-secondary transition-all duration-500">
						<SpeedIcon sx={{ fontSize: 32 }} />
					</div>
					<div>
						<h1 class="text-4xl font-black text-white tracking-tighter uppercase italic">Active Workers</h1>
						<p class="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
							<span class="w-2 h-2 rounded-full bg-secondary animate-pulse" />
							Distributed Processing Nodes
						</p>
					</div>
				</div>

				<button
					onClick={() => navigate('/storage_workers/register')}
					class="bg-secondary text-primary font-black px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 uppercase text-xs tracking-[0.2em] shadow-xl shadow-secondary/20"
				>
					<AddIcon />
					Register Worker
				</button>
			</div>

			{/* Workers Table */}
			<div class="overflow-x-auto rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b border-white/10 bg-white/[0.02]">
							<th class="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Worker Identity</th>
							<th class="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Target Cluster</th>
							<th class="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Encrypted Token</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						<Show
							when={storageWorkers().length > 0}
							fallback={
								<tr>
									<td colspan="3" class="px-8 py-24 text-center">
										<p class="text-white/20 italic font-bold uppercase tracking-widest text-xs mb-4">No active workers detected in this sector</p>
										<button 
											onClick={() => navigate('/storage_workers/register')}
											class="text-secondary hover:underline text-[10px] font-black uppercase tracking-widest"
										>
											Initialize First Worker
										</button>
									</td>
								</tr>
							}
						>
							<For each={storageWorkers()}>
								{(sw) => (
									<tr class="group hover:bg-white/[0.02] transition-colors">
										<td class="px-8 py-6">
											<span class="text-sm font-black text-white tracking-tight uppercase italic">{sw.name}</span>
										</td>
										<td class="px-8 py-6">
											<span class="text-xs font-bold text-white/40 font-mono tracking-tighter">{sw.storage_id}</span>
										</td>
										<td class="px-8 py-6">
											<div class="flex items-center gap-3">
												<code class="text-[10px] bg-white/5 px-3 py-2 rounded-lg text-secondary font-mono tracking-tighter block truncate max-w-xs">
													{sw.token}
												</code>
												<button 
													onClick={() => copyToClipboard(sw.token)}
													class="p-2 text-white/20 hover:text-white transition-all"
													title="Copy Token"
												>
													<ContentCopyIcon sx={{ fontSize: 16 }} />
												</button>
											</div>
										</td>
									</tr>
								)}
							</For>
						</Show>
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default StorageWorkers
