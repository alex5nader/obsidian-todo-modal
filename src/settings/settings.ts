import {App, ExtraButtonComponent, PluginSettingTab, Setting, TextComponent} from "obsidian";
import TodoModalPlugin from "../main";
import {ListEditor, ListEntry} from "./ListEditor";

export interface TodoModalPluginSettings {
    todoPath: string;
    groups: string[];
    priorities: string[];
    defaultPriority: number;
}

export const DEFAULT_SETTINGS: TodoModalPluginSettings = {
    todoPath: "",
    groups: [],
    priorities: ["low", "medium", "high"],
    defaultPriority: 0,
};

interface CreateListOptions {
    list: string[];
    label: string;
    addButtonLabel: string;
    entryPlaceholder: string;
    initialEntryValue: string;
}

export class TodoModalPluginSettingsTab extends PluginSettingTab {
    plugin: TodoModalPlugin;

    constructor(app: App, plugin: TodoModalPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl("h2", {text: "Todo Modal Settings"});

        new Setting(containerEl)
            .setName("Todo Folder")
            .addText(text => {
                text.setValue(this.plugin.settings.todoPath);
                text.onChange(async (value) => {
                    this.plugin.settings.todoPath = value
                    await this.plugin.saveSettings();
                });
            });
        //todo?: use FuzzySuggestModal

        const groupsEditor = this.#createListEditor(containerEl, {
            list: this.plugin.settings.groups,
            label: "Groups",
            addButtonLabel: "New group",
            entryPlaceholder: "Group name",
            initialEntryValue: "",
        });

        const prioritiesEditor = this.#createListEditor(containerEl, {
            list: this.plugin.settings.priorities,
            label: "Priorities",
            addButtonLabel: "New priority",
            entryPlaceholder: "Priority",
            initialEntryValue: "",
        });

        new Setting(containerEl)
            .addButton(button => {
                button.setButtonText("Save all groups and priorities");
                button.onClick(async _ => {
                    groupsEditor.applyAll();
                    prioritiesEditor.applyAll();
                    await this.plugin.saveSettings();
                });
            });
    }

    #createListEditor(containerEl: HTMLElement, options: CreateListOptions): ListEditor {
        let listEditor = new ListEditor();

        containerEl.createDiv("tmp-list-setting", div => {
            let itemsDiv: HTMLDivElement;

            const setting = new Setting(div)
                .setName(options.label)
                .addButton(button => {
                    button.setButtonText(options.addButtonLabel);
                    button.setCta();
                    button.onClick(_ => {
                        listEditor.add(this.#createListEntry(itemsDiv, options.list.length, options));
                    });
                });
            setting.settingEl.classList.add("tmp-list-header");
            setting.nameEl.innerHTML = `<strong>${setting.nameEl.innerHTML}</strong>`;

            itemsDiv = div.createDiv({}, itemsDiv => {
                options.list.forEach((group, idx) => {
                    listEditor.add(this.#createListEntry(itemsDiv, idx, options, group));
                });
            });
        });

        return listEditor;
    }

    #createListEntry(
        itemsDiv: HTMLDivElement,
        idx: number,
        options: CreateListOptions,
        initialValue: string = options.initialEntryValue
    ): ListEntry {
        let value = initialValue;

        function apply() {
            options.list[idx] = value;
        }

        let itemEl: HTMLElement;

        function remove() {
            itemEl.hide();
            options.list.splice(idx, 1);
        }

        itemEl = itemsDiv.createDiv("setting-item", item => {
            item.createDiv("setting-item-info");

            item.createDiv("setting-item-control", control => {
                new TextComponent(control)
                    .setValue(value)
                    .setPlaceholder(options.entryPlaceholder)
                    .onChange(evt => value = evt);

                new ExtraButtonComponent(control)
                    .setIcon("install")
                    .onClick(async () => {
                        apply();
                        await this.plugin.saveSettings();
                    });

                new ExtraButtonComponent(control)
                    .setIcon("trash")
                    .onClick(async () => {
                        remove();
                        await this.plugin.saveSettings();
                    });
            });
        });

        return { apply, remove };
    }
}
