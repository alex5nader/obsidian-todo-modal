export class ListEditor {
    #entries: ListEntry[] = [];

    add(entry: ListEntry) {
        this.#entries.push(entry);
    }

    applyAll() {
        for (const entry of this.#entries) {
            entry.apply();
        }
    }

    removeAll() {
        for (const entry of this.#entries) {
            entry.remove();
        }
    }
}

export interface ListEntry {
    apply(): void;
    remove(): void;
}
