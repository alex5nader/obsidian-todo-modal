import {App, ExtraButtonComponent, PluginSettingTab, Setting, TextComponent} from "obsidian";
import TodoModalPlugin from "./main";

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

        this.#createListEditor(containerEl, {
            list: this.plugin.settings.groups,
            label: "Groups",
            addButtonLabel: "New group",
            entryPlaceholder: "Group name",
            initialEntryValue: "",
        });

        this.#createListEditor(containerEl, {
            list: this.plugin.settings.priorities,
            label: "Priorities",
            addButtonLabel: "New priority",
            entryPlaceholder: "Priority",
            initialEntryValue: "",
        });
    }

    #createListEditor(containerEl: HTMLElement, options: CreateListOptions) {
        containerEl.createDiv("tmp-list-setting", div => {
            let itemsDiv: HTMLDivElement;

            const setting = new Setting(div)
                .setName(options.label)
                .addButton(button => {
                    button.setButtonText(options.addButtonLabel);
                    button.setCta();
                    button.onClick(_ => {
                        this.#createListEntry(itemsDiv, options.list.length, options);
                    });
                });
            setting.settingEl.classList.add("tmp-list-header");
            setting.nameEl.innerHTML = `<strong>${setting.nameEl.innerHTML}</strong>`;

            itemsDiv = div.createDiv({}, itemsDiv => {
                options.list.forEach((group, idx) => {
                    this.#createListEntry(itemsDiv, idx, options, group);
                });
            });
        });
    }

    #createListEntry(
        itemsDiv: HTMLDivElement,
        idx: number,
        options: CreateListOptions,
        initialValue: string = options.initialEntryValue
    ) {
        itemsDiv.createDiv("setting-item", item => {
            item.createDiv("setting-item-info");

            item.createDiv("setting-item-control", control => {
                new TextComponent(control)
                    .setValue(initialValue)
                    .setPlaceholder(options.entryPlaceholder)
                    .onChange(async (evt) => {
                        options.list[idx] = evt;
                        await this.plugin.saveSettings();
                    });

                new ExtraButtonComponent(control)
                    .setIcon("trash")
                    .onClick(async () => {
                        item.hide();
                        options.list.splice(idx, 1);
                        await this.plugin.saveSettings();
                    });
            });
        });
    }
}
