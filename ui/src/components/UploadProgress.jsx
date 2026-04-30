import { For, Show, createSignal, onCleanup, createEffect } from 'solid-js'
import CloudUploadIcon from '@suid/icons-material/CloudUpload'
import SpeedIcon from '@suid/icons-material/Speed'
import AccessTimeIcon from '@suid/icons-material/AccessTime'
import { convertSize } from '../common/size_converter'

const UploadItem = (props) => {
	const [speed, setSpeed] = createSignal(0)
	const [eta, setEta] = createSignal(0)
	const [status, setStatus] = createSignal('Uploading')
	let lastLoaded = 0
	let lastTime = Date.now()

	createEffect(() => {
		const progress = props.progress
		if (progress) {
			if (progress.percentage >= 100) {
				if (progress.verified) {
					setStatus('Saved!')
				} else {
					setStatus('Committing...')
				}
			} else {
				setStatus('Uploading')
				const now = Date.now()
				// ... (speed logic preserved)
				const deltaT = (now - lastTime) / 1000
				if (deltaT >= 0.8) {
					const deltaL = progress.loaded - lastLoaded
					const currentSpeed = deltaL / deltaT
					setSpeed(currentSpeed)
					
					const remaining = progress.total - progress.loaded
					setEta(currentSpeed > 0 ? remaining / currentSpeed : 0)
					
					lastLoaded = progress.loaded
					lastTime = now
				}
			}
		}
	})

	const formatEta = (seconds) => {
		if (status() === 'Committing...') return 'FINALIZING...'
		if (status() === 'Saved!') return 'SUCCESS'
		if (!seconds || seconds === Infinity) return '--:--'
		if (seconds < 60) return `${Math.round(seconds)}s`
		const mins = Math.floor(seconds / 60)
		const secs = Math.round(seconds % 60)
		return `${mins}m ${secs}s`
	}

	return (
		<div class="glass-panel p-3 border-secondary/20 relative overflow-hidden animate-in slide-in-from-left duration-300">
			<div 
				class={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${status() === 'Committing...' ? 'bg-green-400 animate-pulse' : (status() === 'Saved!' ? 'bg-green-500' : 'bg-secondary shadow-[0_0_10px_rgba(249,233,0,0.4)]')}`}
				style={{ width: `${props.progress.percentage}%` }}
			/>
			<div class="flex items-center justify-between gap-4 relative z-10">
				<div class="flex items-center gap-3 overflow-hidden">
					<div class={`p-1.5 rounded-lg transition-colors ${status().startsWith('Committing') || status() === 'Saved!' ? 'bg-green-500/20 text-green-400' : 'bg-secondary/10 text-secondary'}`}>
						<CloudUploadIcon sx={{ fontSize: 16 }} />
					</div>
					<div class="truncate">
						<p class="text-[10px] font-black text-white uppercase truncate w-32">{props.fileName}</p>
						<div class="flex gap-2 text-[8px] font-bold uppercase">
							<span class={status().startsWith('Committing') || status() === 'Saved!' ? 'text-green-400' : 'text-white/40'}>
								{status() === 'Committing...' ? 'Saving... (Est 1-3s)' : (status() === 'Saved!' ? 'Verified' : `${props.progress.percentage}%`)}
							</span>
							<Show when={status() === 'Uploading'}>
								<span class="text-white/20">{convertSize(speed())}/s</span>
							</Show>
						</div>
					</div>
				</div>
				<div class={`text-[9px] font-black font-mono ${status().startsWith('Committing') || status() === 'Saved!' ? 'text-green-400 animate-pulse' : 'text-secondary'}`}>
					{formatEta(eta())}
				</div>
			</div>
		</div>
	)
}

const UploadProgress = (props) => {
	return (
		<Show when={props.uploads && props.uploads.length > 0}>
			<div class="fixed bottom-6 left-6 z-[300] w-72 space-y-2">
				<div class="flex items-center justify-between mb-3 px-2">
					<h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Active Transfers</h3>
					<span class="bg-secondary text-primary text-[8px] font-black px-1.5 py-0.5 rounded-md">
						{props.uploads.length}
					</span>
				</div>
				<For each={props.uploads}>
					{(upload) => <UploadItem fileName={upload.name} progress={upload.progress} />}
				</For>
			</div>
		</Show>
	)
}

export default UploadProgress
