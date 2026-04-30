import { createEffect, createSignal, Show } from 'solid-js'

const CreateFolderDialog = (props) => {
	const [errFolderName, setErrFolderName] = createSignal(null)
	const [folderName, setFolderName] = createSignal('')

	let folderNameInput

	createEffect(() => {
		if (props.isOpened) {
			setTimeout(() => folderNameInput?.focus(), 200)
		}
	})

	const validateFolderName = (e) => {
		const value = e.currentTarget.value
		setErrFolderName(value.includes('/') ? 'Folder name cannot contain "/"' : null)
		setFolderName(value)
	}

	const handleClose = () => {
		setErrFolderName(null)
		setFolderName('')
		props.onClose()
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		if (!folderName() || errFolderName()) return
		const name = folderName()
		handleClose()
		await props.onCreate(name)
	}

	return (
		<Show when={props.isOpened}>
			<div class="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
				{/* Backdrop */}
				<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
				
				{/* Modal */}
				<div class="glass-panel w-full max-w-md p-8 relative z-10 animate-in zoom-in-95 duration-300">
					<h2 class="text-2xl font-bold text-white mb-2">Create New Folder</h2>
					<p class="text-white/40 text-sm mb-6">Give your new folder a name to keep things organized.</p>
					
					<form onSubmit={handleSubmit} class="space-y-6">
						<div class="space-y-2">
							<label class="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Folder Name</label>
							<input
								ref={folderNameInput}
								value={folderName()}
								onInput={validateFolderName}
								required
								placeholder="e.g. Project Assets"
								class={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
									errFolderName() ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-secondary/50 focus:bg-white/10'
								}`}
							/>
							<Show when={errFolderName()}>
								<p class="text-xs text-red-400 ml-1">{errFolderName()}</p>
							</Show>
						</div>

						<div class="flex gap-3 pt-2">
							<button
								type="button"
								onClick={handleClose}
								class="flex-1 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={!folderName().length || errFolderName()}
								class="flex-1 bg-secondary text-primary font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-secondary/20"
							>
								Create Folder
							</button>
						</div>
					</form>
				</div>
			</div>
		</Show>
	)
}

export default CreateFolderDialog
