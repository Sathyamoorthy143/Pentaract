import { useBeforeLeave, useNavigate, useParams, A } from '@solidjs/router'
import { Show, createSignal, For, onCleanup, onMount, createMemo } from 'solid-js'
import FolderIcon from '@suid/icons-material/Folder'
import InsertDriveFileIcon from '@suid/icons-material/InsertDriveFile'
import MoreVertIcon from '@suid/icons-material/MoreVert'
import CloudUploadIcon from '@suid/icons-material/CloudUpload'
import CreateNewFolderIcon from '@suid/icons-material/CreateNewFolder'
import LockIcon from '@suid/icons-material/Lock'
import ArrowBackIcon from '@suid/icons-material/ArrowBack'
import GridViewIcon from '@suid/icons-material/GridView'
import ListIcon from '@suid/icons-material/List'
import HistoryIcon from '@suid/icons-material/History'

import API from '../../api'
import { alertStore } from '../../components/AlertStack'
import CreateFolderDialog from '../../components/CreateFolderDialog'
import BulkActionBar from '../../components/BulkActionBar'
import Access from '../../components/Access'
import UploadProgress from '../../components/UploadProgress'
import FileTable from '../../components/FileTable'
import { searchQuery, selectedItems, toggleItemSelection, clearSelection } from '../../common/store'
import { convertSize } from '../../common/size_converter'

const Files = () => {
	const { addAlert } = alertStore
	const [fsLayer, setFsLayer] = createSignal([])
	const [storage, setStorage] = createSignal()
	const [isAccessPage, setIsAccessPage] = createSignal(false)
	const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = createSignal(false)
	const [users, setUsers] = createSignal([])
	
	// View state
	const [viewMode, setViewMode] = createSignal('grid')
	const [isVaultLocked, setIsVaultLocked] = createSignal(false)
	const [vaultPassword, setVaultPassword] = createSignal('')
	
	// Upload state
	const [activeUploads, setActiveUploads] = createSignal([])
	const [isDragging, setIsDragging] = createSignal(false)
	
	const navigate = useNavigate()
	const params = useParams()
	const basePath = () => `/storages/${params.id}/files`

	let uploadFileInputElement
	let uploadFolderInputElement

	const filteredFiles = createMemo(() => {
		const query = searchQuery().toLowerCase()
		let items = fsLayer().filter(item => item.name.toLowerCase().includes(query))
		
		// Category-Based Sorting (Folders -> Extension -> Name)
		return items.sort((a, b) => {
			if (a.is_file !== b.is_file) return a.is_file ? 1 : -1
			if (a.is_file) {
				const extA = a.name.split('.').pop().toLowerCase()
				const extB = b.name.split('.').pop().toLowerCase()
				if (extA !== extB) return extA.localeCompare(extB)
			}
			return a.name.localeCompare(b.name)
		})
	})

	const checkVaultAccess = () => {
		const path = params.path || ''
		const isVaultPath = path.toLowerCase().startsWith('master') || path.toLowerCase().startsWith('backup')
		if (isVaultPath) {
			const isVerified = sessionStorage.getItem(`vault_verified_${params.id}`) === 'true'
			setIsVaultLocked(!isVerified)
		} else {
			setIsVaultLocked(false)
		}
	}

	const handleVaultUnlock = async (e) => {
		e.preventDefault()
		try {
			// In a real scenario, we'd call API.users.verifyMasterPassword(vaultPassword())
			// For this demo, we'll simulate the check
			if (vaultPassword() === 'admin123') { // Placeholder
				sessionStorage.setItem(`vault_verified_${params.id}`, 'true')
				setIsVaultLocked(false)
				addAlert('Vault Decrypted', 'success')
			} else {
				addAlert('Invalid Master Key', 'error')
			}
		} catch (err) {
			addAlert('Verification failed', 'error')
		}
	}

	const fetchFSLayer = async (path = params.path) => {
		checkVaultAccess()
		if (!isVaultLocked()) {
			const fsLayerRes = await API.files.getFSLayer(params.id, path)
			setFsLayer(fsLayerRes)
		}
	}

	const fetchStorage = async () => {
		const storageRes = await API.storages.getStorage(params.id)
		setStorage(storageRes)
	}

	onMount(() => {
		Promise.all([fetchStorage(), fetchFSLayer()]).then()
		clearSelection()
	})

	useBeforeLeave((e) => {
		if (e.to.startsWith(basePath())) {
			let newPath = e.to.slice(basePath().length).replace(/^\//, '')
			fetchFSLayer(newPath)
			clearSelection()
		}
	})

	const uploadFiles = async (files) => {
		if (!files || files.length === 0) return
		const fileList = Array.from(files)
		const BATCH_SIZE = 3
		
		try {
			for (let i = 0; i < fileList.length; i += BATCH_SIZE) {
				const batch = fileList.slice(i, i + BATCH_SIZE)
				const uploadPromises = batch.map(async (file) => {
					const uploadId = Math.random().toString(36).substring(7)
					const relativePath = file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(0, -1).join('/') : ''
					const targetPath = params.path ? `${params.path}/${relativePath}` : relativePath
					
					setActiveUploads(prev => [...prev, { id: uploadId, name: file.name, progress: { percentage: 0, loaded: 0, total: file.size } }])
					
					try {
						await API.files.uploadFile(params.id, targetPath, file, (progress) => {
							setActiveUploads(prev => prev.map(u => u.id === uploadId ? { ...u, progress } : u))
						})
						setActiveUploads(prev => prev.map(u => u.id === uploadId ? { ...u, progress: { ...u.progress, percentage: 100, verified: true } } : u))
						
						// Incremental refresh: update the file list as soon as each file is verified
						fetchFSLayer()
					} catch (err) {
						console.error(`Upload error for ${file.name}:`, err)
						const msg = err.message || err.toString()
						addAlert(`Failed to upload ${file.name}: ${msg}`, 'error')
					} finally {
						setTimeout(() => setActiveUploads(prev => prev.filter(u => u.id !== uploadId)), 2000)
					}
				})
				await Promise.all(uploadPromises)
			}
		} catch (err) {
			console.error('Batch upload error:', err)
			addAlert(`Batch process interrupted: ${err.message}`, 'error')
		}
	}

	const handleFileSelect = (event) => { uploadFiles(event.target.files); event.target.value = null; }
	const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); }
	const handleDragLeave = (e) => { if (e.relatedTarget === null || !e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); }
	const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); uploadFiles(Array.from(e.dataTransfer.files)); }

	const deleteSelected = async () => {
		const items = selectedItems()
		if (!confirm(`Are you sure you want to delete ${items.length} items?`)) return
		for (const item of items) await API.files.deleteFile(params.id, item.path)
		addAlert(`Deleted ${items.length} items`, 'success')
		clearSelection(); fetchFSLayer();
	}

	return (
		<div class="max-w-7xl mx-auto space-y-10 py-6" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
			<UploadProgress uploads={activeUploads()} />

			<Show when={isDragging()}>
				<div class="fixed inset-0 z-[300] bg-secondary/10 backdrop-blur-sm border-4 border-dashed border-secondary m-8 rounded-3xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
					<CloudUploadIcon sx={{ fontSize: 120 }} class="text-secondary animate-bounce" />
					<h2 class="text-4xl font-black text-secondary tracking-tighter uppercase mt-4">Drop to Upload</h2>
				</div>
			</Show>

			<div class="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-white/[0.03]">
				<div class="flex items-center gap-6">
					<button onClick={() => navigate('/storages')} class="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all active:scale-90"><ArrowBackIcon /></button>
					<div class="space-y-1">
						<h1 class="text-4xl font-black text-white tracking-tighter uppercase italic">{storage()?.name || 'Node...'}</h1>
						<p class="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
							<span class="w-2 h-2 rounded-full bg-secondary animate-pulse" />
							Mount point: {params.path || '/root'}
						</p>
					</div>
				</div>

				<div class="flex items-center gap-4">
					<div class="flex p-1 bg-black/40 rounded-xl border border-white/10">
						<button onClick={() => setViewMode('grid')} class={`p-2 rounded-lg transition-all ${viewMode() === 'grid' ? 'bg-secondary text-primary' : 'text-white/40'}`}><GridViewIcon sx={{ fontSize: 18 }} /></button>
						<button onClick={() => setViewMode('list')} class={`p-2 rounded-lg transition-all ${viewMode() === 'list' ? 'bg-secondary text-primary' : 'text-white/40'}`}><ListIcon sx={{ fontSize: 18 }} /></button>
					</div>
					
					<button onClick={() => navigate('/logs')} class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition-all" title="Audit Logs"><HistoryIcon /></button>

					<div class="h-8 w-[1px] bg-white/10 mx-2" />

					<Show when={!isAccessPage()}>
						<button onClick={() => uploadFileInputElement.click()} class="group bg-white text-black font-black px-4 py-2.5 rounded-xl hover:bg-secondary transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest">
							<CloudUploadIcon sx={{ fontSize: 18 }} /> Files
						</button>
					</Show>
				</div>
			</div>

			<Show when={isVaultLocked()} fallback={
				<Show when={viewMode() === 'grid'} fallback={
					<FileTable files={filteredFiles()} isSelected={(i) => selectedItems().some(s => s.path === i.path)} onSelect={toggleItemSelection} onNavigate={(path) => navigate(`${basePath()}/${path}`)} />
				}>
					<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						<Show when={params.path}>
							<div onClick={() => { const parent = params.path.split('/').slice(0, -1).join('/'); navigate(`${basePath()}/${parent}`) }} class="glass-card p-4 flex flex-col items-center justify-center gap-2 cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
								<FolderIcon sx={{ fontSize: 40 }} /> <span class="text-[10px] uppercase font-black">Back</span>
							</div>
						</Show>
						<For each={filteredFiles()}>
							{(item) => {
								const isSelected = createMemo(() => selectedItems().some(i => i.path === item.path))
								return (
									<div class={`glass-card p-4 flex flex-col items-center relative group transition-all duration-200 ${isSelected() ? 'ring-2 ring-secondary bg-secondary/5 border-secondary/30' : ''}`} onClick={() => item.is_file ? toggleItemSelection(item) : navigate(`${basePath()}/${item.path}`)}>
										<div class="mb-3 p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform duration-300">
											<Show when={item.is_file} fallback={<FolderIcon sx={{ fontSize: 48, color: '#F9E900' }} />}><InsertDriveFileIcon sx={{ fontSize: 48, color: '#34D399' }} /></Show>
										</div>
										<span class="text-sm font-semibold text-white truncate w-full text-center mb-1">{item.name}</span>
										<span class="text-[10px] text-white/30 font-mono">{item.is_file ? convertSize(item.size) : 'Folder'}</span>
									</div>
								)
							}}
						</For>
					</div>
				</Show>
			}>
				<div class="glass-panel p-20 flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500">
					<div class="p-6 bg-red-500/10 rounded-full text-red-500 animate-pulse"><LockIcon sx={{ fontSize: 64 }} /></div>
					<div class="text-center space-y-2">
						<h2 class="text-3xl font-black text-white tracking-tighter uppercase">Encrypted Vault</h2>
						<p class="text-white/40 text-xs font-bold uppercase tracking-widest">Master authorization required to decrypt sector</p>
					</div>
					<form onSubmit={handleVaultUnlock} class="flex flex-col items-center gap-4 w-full max-w-sm">
						<div class="flex gap-2 w-full">
							<input type="password" placeholder="ENTER MASTER KEY" class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-secondary transition-colors" value={vaultPassword()} onInput={(e) => setVaultPassword(e.target.value)} />
							<button type="submit" class="bg-white text-black font-black px-6 py-3 rounded-xl hover:bg-secondary transition-all">DECRYPT</button>
						</div>
						<button 
							type="button" 
							onClick={async () => {
								try {
									await API.apiRequest('/users/master_password/reset_request', 'post', API.getAuthToken())
									addAlert('Recovery link sent to your registered email', 'success')
								} catch (err) {
									addAlert('Failed to initiate recovery protocol', 'error')
								}
							}}
							class="text-[10px] font-black text-white/20 hover:text-secondary uppercase tracking-widest transition-colors"
						>
							Forgot Master Key? Initiate Rescue Protocol
						</button>
					</form>
				</div>
			</Show>

			<BulkActionBar count={selectedItems().length} onClear={clearSelection} onDelete={deleteSelected} />
			<CreateFolderDialog isOpened={isCreateFolderDialogOpen()} onCreate={async (name) => { await API.files.createFolder(params.id, params.path, name); fetchFSLayer(); }} onClose={() => setIsCreateFolderDialogOpen(false)} />
			<input ref={(el) => { uploadFileInputElement = el }} type="file" class="hidden" onChange={handleFileSelect} multiple />
			<input ref={(el) => { uploadFolderInputElement = el }} type="file" class="hidden" onChange={handleFileSelect} webkitdirectory directory />
		</div>
	)
}

export default Files
