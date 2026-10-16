import React, { createContext, useContext, useState } from 'react';
import { Checkbox } from 'react-magma-dom';

const SelectionContext = createContext(null);

export function SelectionProvider({ itemIds, children }) {
  const [selected, setSelected] = useState(new Set());
  // Folder and section checkboxes represent their descendants, not extra items.
  const selectableIds = itemIds.filter((id) => !itemIds.some((other) => other.startsWith(`${id}/`)));
  const selectedIds = selectableIds.filter((id) => selected.has(id));
  return <SelectionContext.Provider value={{ itemIds: selectableIds, selected, selectedIds, setSelected }}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  return useContext(SelectionContext);
}

export function SelectionCheckbox({ id, label, group = false, all = false }) {
  const { itemIds, selected, setSelected } = useSelection();
  const ids = all ? itemIds : group ? itemIds.filter((key) => key === id || key.startsWith(`${id}/`)) : [id];
  const checked = ids.length > 0 && ids.every((key) => selected.has(key));
  const toggle = () => setSelected((current) => {
    const next = new Set(current);
    ids.forEach((key) => checked ? next.delete(key) : next.add(key));
    return next;
  });
  return <span className="selection-checkbox"><Checkbox labelText={label} isTextVisuallyHidden checked={checked} color="#0b1f3a" onChange={toggle} /></span>;
}
