import { createSignal, onMount, For } from 'solid-js'
import API from '../api'
import HistoryIcon from '@suid/icons-material/History'
import ErrorOutlineIcon from '@suid/icons-material/ErrorOutline'

const ActivityLog = () => {
	const [logs, setLogs] = createSignal([])
	const [loading, setLoading] = createSignal(true)

	onMount(async () => {
		try {
			const res = await API.logs.listLogs()
			setLogs(res)
		} catch (err) {
			console.error(err)
		} finally {
			setLoading(false)
		}
	})

	const getActionColor = (action) => {
		switch (action) {
			case 'DELETE': return 'text-red-400 bg-red-400/10'
			case 'CREATE_FOLDER': return 'text-secondary bg-secondary/10'
			case 'UPLOAD': return 'text-green-400 bg-green-400/10'
			case 'RENAME': return 'text-blue-400 bg-blue-400/10'
			case 'COPY': return 'text-purple-400 bg-purple-400/10'
			default: return 'text-white/40 bg-white/5'
		}
	}

	return (
		<div class="max-w-4xl mx-auto py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div class="flex items-center gap-6 glass-panel p-6 border-secondary/20">
				<div class="p-4 bg-secondary/10 rounded-2xl text-secondary shadow-[0_0_20px_rgba(249,233,0,0.2)]">
					<HistoryIcon sx={{ fontSize: 32 }} />
				</div>
				<div>
					<h1 class="text-4xl font-black text-white tracking-tighter uppercase italic">Operation Logs</h1>
					<p class="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Audit trail of all distributed actions</p>
				</div>
			</div>

			<Show when={!loading()} fallback={
				<div class="flex justify-center p-20">
					<div class="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
				</div>
			}>
				<div class="space-y-3">
					<For each={logs()}>
						{(log) => (
							<div class="glass-panel p-4 flex items-center justify-between group hover:border-white/20 transition-all border-white/[0.03]">
								<div class="flex items-center gap-6">
									<div class={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${getActionColor(log.action)}`}>
										{log.action}
									</div>
									<div class="space-y-0.5">
										<p class="text-sm font-bold text-white/80 group-hover:text-white transition-colors">
											{log.details}
										</p>
										<p class="text-[10px] font-mono text-white/20">
											{new Date(log.created_at).toLocaleString()}
										</p>
									</div>
								</div>
							</div>
						)}
					</For>
					<Show when={logs().length === 0}>
						<div class="glass-panel p-20 flex flex-col items-center justify-center text-white/20 italic font-bold tracking-widest gap-4">
							<ErrorOutlineIcon sx={{ fontSize: 48 }} />
							No operations recorded in the audit vault
						</div>
					</Show>
				</div>
			</Show>
		</div>
	)
}

export default ActivityLog
