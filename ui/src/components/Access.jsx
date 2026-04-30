import Grid from '@suid/material/Grid'
import Paper from '@suid/material/Paper'
import Table from '@suid/material/Table'
import TableBody from '@suid/material/TableBody'
import TableCell from '@suid/material/TableCell'
import TableContainer from '@suid/material/TableContainer'
import TableHead from '@suid/material/TableHead'
import TableRow from '@suid/material/TableRow'
import IconButton from '@suid/material/IconButton'
import DeleteIcon from '@suid/icons-material/Delete'
import EditIcon from '@suid/icons-material/Edit'
import { Show, createSignal, For, onMount } from 'solid-js'
import { useParams } from '@solidjs/router'

import createLocalStore from '../../libs'
import AccessTypeChip from './AccessTypeChip'
import API from '../api'
import ActionConfirmDialog from './ActionConfirmDialog'
import { alertStore } from './AlertStack'
import GrantAccess from './GrantAccess'

/**
 * @typedef {Object} AccessProps
 * @property {() => void} setIsGrantAccessVisible
 * @property {() => void} onMount
 * @property {import('../api').UserWithAccess[]} users
 * @property {() => Promise<void>} refetchUsers
 */

/**
 *
 * @param {AccessProps} props
 */
const Access = (props) => {
	const [selectedUserEmail, setSelectedUserEmail] = createSignal()
	const [isRestrictConfirmOpened, setIsRestrictConfirmOpened] =
		createSignal(false)
	const [isChangeAccessOpened, setIsChangeAccessOpened] = createSignal(false)
	const [store, _setStore] = createLocalStore()
	const { addAlert } = alertStore
	const params = useParams()

	onMount(props.onMount)

	const onEditButtonClicked = (email) => {
		setSelectedUserEmail(email)
		setIsChangeAccessOpened(true)
	}

	const onChangeAccess = async () => {
		setIsChangeAccessOpened(false)
		await props.refetchUsers()
	}

	const onDeleteButtonClicked = (email) => {
		setSelectedUserEmail(email)
		setIsRestrictConfirmOpened(true)
	}

	const onRestrict = async () => {
		const userID = props.users.find((u) => u.email === selectedUserEmail()).id

		await API.access.restrictAccess(params.id, userID)
		addAlert(
			`Restricted access for the user with email ${selectedUserEmail()}`,
			'success'
		)

		await props.refetchUsers()
	}

	return (
		<div class="space-y-6">
			<div class="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b border-white/10 bg-white/[0.02]">
							<th class="px-6 py-4 text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Authorized User</th>
							<th class="px-6 py-4 text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Clearance Level</th>
							<th class="px-6 py-4 text-right text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						<Show
							when={props.users.length > 0}
							fallback={
								<tr>
									<td colspan="3" class="px-6 py-20 text-center text-white/30 italic font-medium uppercase tracking-widest text-xs">
										No external access protocols initialized
									</td>
								</tr>
							}
						>
							<For each={props.users}>
								{(user) => (
									<tr class="group hover:bg-white/[0.02] transition-colors">
										<td class="px-6 py-5">
											<div class="flex items-center gap-3">
												<div class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-black text-[10px] uppercase">
													{user.email[0]}
												</div>
												<span class="text-sm font-bold text-white tracking-tight">{user.email}</span>
											</div>
										</td>
										<td class="px-6 py-5">
											<AccessTypeChip at={user.access_type} />
										</td>
										<td class="px-6 py-5 text-right">
											<div class="flex items-center justify-end gap-2">
												<button
													disabled={store.user?.email === user.email}
													onClick={() => onEditButtonClicked(user.email)}
													class="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-secondary hover:text-primary transition-all disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-white/40"
													title="Modify Permissions"
												>
													<EditIcon sx={{ fontSize: 18 }} />
												</button>

												<button
													disabled={store.user?.email === user.email}
													onClick={() => onDeleteButtonClicked(user.email)}
													class="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-red-500 hover:text-white transition-all disabled:opacity-20"
													title="Revoke Access"
												>
													<DeleteIcon sx={{ fontSize: 18 }} />
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

			<ActionConfirmDialog
				action="Restrict"
				actionDescription={`restrict access for the user with email "${selectedUserEmail()}"`}
				entity="access"
				isOpened={isRestrictConfirmOpened()}
				onCancel={() => setIsRestrictConfirmOpened(false)}
				onConfirm={onRestrict}
			/>

			<GrantAccess
				afterGrant={onChangeAccess}
				email={selectedUserEmail()}
				isVisible={isChangeAccessOpened()}
				onClose={() => setIsChangeAccessOpened(false)}
			/>
		</div>
	)
}

export default Access
