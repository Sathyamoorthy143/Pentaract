import { For, Show, createMemo } from 'solid-js'
import FolderIcon from '@suid/icons-material/Folder'
import InsertDriveFileIcon from '@suid/icons-material/InsertDriveFile'
import { convertSize } from '../common/size_converter'

const FileTable = (props) => {
	const getFileIcon = (item) => {
		if (!item.is_file) return <FolderIcon class="text-secondary" />
		return <InsertDriveFileIcon class="text-green-400" />
	}

	const formatDate = (dateStr) => {
		if (!dateStr) return '--'
		const date = new Date(dateStr)
		return date.toLocaleString()
	}

	const getFileType = (name) => {
		if (name.includes('.')) return name.split('.').pop().toUpperCase()
		return 'File'
	}

	return (
		<div class="glass-panel overflow-hidden border-white/5">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="bg-white/[0.02] border-b border-white/10">
						<th class="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Name</th>
						<th class="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Type</th>
						<th class="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Size</th>
						<th class="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Modified</th>
					</tr>
				</thead>
				<tbody>
					<For each={props.files}>
						{(item) => (
							<tr 
								class={`group hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/[0.02] ${props.isSelected(item) ? 'bg-secondary/5' : ''}`}
								onClick={() => props.onSelect(item)}
								onDblClick={() => !item.is_file && props.onNavigate(item.path)}
							>
								<td class="p-4">
									<div class="flex items-center gap-3">
										<div class="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
											{getFileIcon(item)}
										</div>
										<span class="text-sm font-bold text-white group-hover:text-secondary transition-colors truncate max-w-[200px]">
											{item.name}
										</span>
									</div>
								</td>
								<td class="p-4 text-[10px] font-mono text-white/40 uppercase tracking-tighter">
									{item.is_file ? getFileType(item.name) : 'Folder'}
								</td>
								<td class="p-4 text-[10px] font-mono text-white/40">
									{item.is_file ? convertSize(item.size) : '--'}
								</td>
								<td class="p-4 text-[10px] font-mono text-white/40">
									{formatDate(item.updated_at)}
								</td>
							</tr>
						)}
					</For>
				</tbody>
			</table>
		</div>
	)
}

export default FileTable
