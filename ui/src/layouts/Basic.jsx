import { onMount } from 'solid-js'
import { Outlet } from '@solidjs/router'
import Header from '../components/Header'
import FileTree from '../components/FileTree'
import Breadcrumbs from '../components/Breadcrumbs'
import { checkAuth } from '../common/auth_guard'

const BasicLayout = () => {
	onMount(checkAuth)

	return (
		<div class="h-screen flex flex-col bg-[#030303] text-white selection:bg-secondary/30 overflow-hidden">
			{/* Background Blobs */}
			<div class="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
				<div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
				<div class="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px]" />
				<div class="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
			</div>

			{/* Fixed Header */}
			<Header />

			<div class="flex-1 flex overflow-hidden pt-24 relative z-10">
				{/* Fixed Sidebar */}
				<aside class="w-80 hidden lg:block border-r border-white/[0.03] overflow-y-auto">
					<FileTree />
				</aside>

				{/* Scrollable Content */}
				<main class="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
					<div class="max-w-7xl mx-auto">
						<Breadcrumbs />
						<div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
							<Outlet />
						</div>
					</div>
				</main>
			</div>
		</div>
	)
}

export default BasicLayout
