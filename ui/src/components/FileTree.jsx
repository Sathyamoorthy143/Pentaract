import { createSignal, createResource, For, Show, onMount } from 'solid-js'
import { A } from '@solidjs/router'
import FolderIcon from '@suid/icons-material/Folder'
import StorageIcon from '@suid/icons-material/Storage'
import SpeedIcon from '@suid/icons-material/Speed'
import ChevronRightIcon from '@suid/icons-material/ChevronRight'
import ExpandMoreIcon from '@suid/icons-material/ExpandMore'
import API from '../api'

const TreeItem = (props) => {
	const [isOpen, setIsOpen] = createSignal(false)
	const [folders] = createResource(
		() => (isOpen() && !props.item.is_file ? { id: props.storageId, path: props.item.path || '' } : null),
		async ({ id, path }) => {
			const data = await API.files.getFSLayer(id, path)
			return data.filter(i => !i.is_file)
		}
	)

	const toggle = (e) => {
		e.preventDefault()
		e.stopPropagation()
		setIsOpen(!isOpen())
	}

	return (
		<div class="select-none">
			<div 
				class={`flex items-center gap-2 py-2 px-3 rounded-xl cursor-pointer group transition-all ${isOpen() ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
				onClick={toggle}
			>
				<div class={`transition-transform duration-500 ${isOpen() ? 'rotate-90 text-secondary' : 'text-white/20'}`}>
					<ChevronRightIcon sx={{ fontSize: 16 }} />
				</div>
				<div class={`transition-colors duration-500 ${isOpen() ? 'text-secondary' : 'text-white/40 group-hover:text-white/80'}`}>
					{props.isStorage ? <StorageIcon sx={{ fontSize: 18 }} /> : <FolderIcon sx={{ fontSize: 18 }} />}
				</div>
				<A 
					href={props.isStorage ? `/storages/${props.storageId}/files` : `/storages/${props.storageId}/files/${props.item.path}`}
					class={`text-[11px] font-bold uppercase tracking-[0.1em] transition-all truncate ${isOpen() ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`}
					onClick={(e) => e.stopPropagation()}
				>
					{props.item.name}
				</A>
			</div>

			<Show when={isOpen()}>
				<div class="ml-5 border-l border-white/[0.05] pl-3 mt-1 space-y-1 animate-in slide-in-from-left-4 duration-500">
					<Show when={folders.loading}>
						<div class="text-[9px] font-black uppercase tracking-widest text-white/10 pl-6 py-2 animate-pulse">Scanning...</div>
					</Show>
					<For each={folders()}>
						{(folder) => (
							<TreeItem item={folder} storageId={props.storageId} />
						)}
					</For>
					<Show when={!folders.loading && folders()?.length === 0}>
						<div class="text-[9px] font-bold uppercase tracking-widest text-white/5 pl-6 py-2 italic">Void</div>
					</Show>
				</div>
			</Show>
		</div>
	)
}

const FileTree = () => {
	const [storages] = createResource(async () => {
		// 1. Instant Recall
		const cached = localStorage.getItem('cache_storages')
		let initial = []
		if (cached) {
			try { initial = JSON.parse(cached) } catch {}
		}

		// 2. Background Verification
		const res = await API.storages.listStorages()
		const list = res?.storages || (Array.isArray(res) ? res : [])
		
		// 3. Update Memory
		localStorage.setItem('cache_storages', JSON.stringify(list))
		
		return list.length > 0 ? list : initial
	})

	return (
		<div class="flex flex-col h-full bg-[#030303]">
			{/* Infrastructure Hub */}
			<div class="p-8 pb-2">
				<h3 class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
					<div class="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(249,233,0,0.4)]" />
					Infrastructure Hub
				</h3>
				<div class="space-y-1">
					<A 
						href="/storages" 
						class="flex items-center gap-3 py-2 px-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/[0.03] transition-all"
						activeClass="text-white bg-white/[0.05] border border-white/5"
					>
						<StorageIcon sx={{ fontSize: 18 }} />
						Data Nodes
					</A>
					<A 
						href="/storage_workers" 
						class="flex items-center gap-3 py-2 px-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/[0.03] transition-all"
						activeClass="text-white bg-white/[0.05] border border-white/5"
					>
						<SpeedIcon sx={{ fontSize: 18 }} />
						Active Workers
					</A>
				</div>
			</div>

			<div class="p-8 py-4">
				<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">
					Network Topology
				</h3>
			</div>
			
			<div class="flex-1 overflow-y-auto px-5 pb-8 custom-scrollbar">
				<Show when={storages.loading}>
					<div class="space-y-3 px-3">
						<div class="h-10 bg-white/5 rounded-xl animate-pulse" />
						<div class="h-10 bg-white/5 rounded-xl animate-pulse w-3/4 opacity-50" />
					</div>
				</Show>

				<For each={storages()}>
					{(storage) => (
						<TreeItem 
							isStorage={true} 
							storageId={storage.id} 
							item={{ name: storage.name, path: '' }} 
						/>
					)}
				</For>
			</div>
		</div>
	)
}

export default FileTree
