import { useLocation, A, useParams } from '@solidjs/router'
import { For, Show, createMemo } from 'solid-js'
import ChevronRightIcon from '@suid/icons-material/ChevronRight'
import HomeIcon from '@suid/icons-material/Home'

const Breadcrumbs = () => {
	const location = useLocation()
	const params = useParams()

	const crumbs = createMemo(() => {
		const path = location.pathname
		if (!path.includes('/files')) return []

		// Extract storage ID and subpath
		const segments = path.split('/').filter(Boolean)
		const filesIndex = segments.indexOf('files')
		if (filesIndex === -1) return []

		const storageId = params.id
		const subPath = segments.slice(filesIndex + 1)
		
		let currentPath = `/storages/${storageId}/files`
		return [
			{ name: 'Root', href: currentPath },
			...subPath.map((seg, i) => {
				currentPath += `/${seg}`
				return { name: decodeURIComponent(seg), href: currentPath }
			})
		]
	})

	return (
		<Show when={crumbs().length > 0}>
			<nav class="flex items-center gap-2 mb-6 px-4 py-2 glass-panel w-fit animate-in fade-in slide-in-from-top-4 duration-500">
				<A href="/storages" class="text-white/40 hover:text-secondary transition-colors">
					<HomeIcon sx={{ fontSize: 18 }} />
				</A>
				
				<For each={crumbs()}>
					{(crumb, i) => (
						<div class="flex items-center gap-2">
							<ChevronRightIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />
							<A 
								href={crumb.href} 
								class={`text-xs font-medium transition-colors ${
									i() === crumbs().length - 1 
										? 'text-secondary pointer-events-none' 
										: 'text-white/60 hover:text-white'
								}`}
							>
								{crumb.name}
							</A>
						</div>
					)}
				</For>
			</nav>
		</Show>
	)
}

export default Breadcrumbs
