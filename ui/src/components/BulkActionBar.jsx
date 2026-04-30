import { Show } from 'solid-js'
import DeleteIcon from '@suid/icons-material/Delete'
import ContentCopyIcon from '@suid/icons-material/ContentCopy'
import MoveToInboxIcon from '@suid/icons-material/MoveToInbox'
import CloseIcon from '@suid/icons-material/Close'

const BulkActionBar = (props) => {
	return (
		<Show when={props.count > 0}>
			<div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
				<div class="glass-panel px-6 py-4 flex items-center gap-6 shadow-2xl border-secondary/20">
					<div class="flex items-center gap-3 pr-6 border-r border-white/10">
						<div class="bg-secondary text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
							{props.count}
						</div>
						<span class="text-sm font-medium text-white">Items selected</span>
					</div>

					<div class="flex items-center gap-2">
						<button 
							class="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm text-white/80"
							onClick={props.onMove}
						>
							<MoveToInboxIcon sx={{ fontSize: 18 }} />
							Move
						</button>
						<button 
							class="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm text-white/80"
							onClick={props.onCopy}
						>
							<ContentCopyIcon sx={{ fontSize: 18 }} />
							Copy
						</button>
						<button 
							class="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-colors text-sm text-white/80"
							onClick={props.onDelete}
						>
							<DeleteIcon sx={{ fontSize: 18 }} />
							Delete
						</button>
					</div>

					<button 
						class="p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors ml-4"
						onClick={props.onClear}
					>
						<CloseIcon sx={{ fontSize: 20 }} />
					</button>
				</div>
			</div>
		</Show>
	)
}

export default BulkActionBar
