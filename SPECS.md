# Feature: Shape Management (Select & Delete)

## 1. Selection Logic ('simple_select')
*   **Trigger:** When the user clicks a specific "Select/Pointer" tool in the sidebar (or clicks away from a draw tool), the map must enter `simple_select` mode.
*   **Behavior:** Users can click an existing or shape to highlight it.
*   **State:** The app must track if a feature is currently selected.

## 2. Deletion Logic
**Trigger:** A "Trash" icon button shall be added to the map toolbar in the top left corner.
*   **Action:** When the Trash button is pressed, execute `draw.trash()`.
*   **Constraint:** The Trash button should only be active/enabled when a shape is actually selected.

## 3. Keyboard Shortcuts
*   **Constraint:** Ensure the `Delete` / `Backspace` keys also trigger deletion if the map has focus.