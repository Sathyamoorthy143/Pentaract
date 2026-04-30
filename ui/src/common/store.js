import { createSignal } from 'solid-js'

export const [searchQuery, setSearchQuery] = createSignal('')
export const [selectedItems, setSelectedItems] = createSignal([])

export const clearSelection = () => setSelectedItems([])
export const toggleItemSelection = (item) => {
	const current = selectedItems()
	if (current.find(i => i.path === item.path)) {
		setSelectedItems(current.filter(i => i.path !== item.path))
	} else {
		setSelectedItems([...current, item])
	}
}
