import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, TodoModalPluginSettings, TodoModalPluginSettingsTab} from "./settings";
import {CreateTodoModal} from "./modal";

export default class TodoModalPlugin extends Plugin {
    settings: TodoModalPluginSettings;

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: 'create-todo',
            name: 'Create Todo',
            checkCallback: (checking) => {
                if (checking) {
                    return !!this.app.workspace.activeLeaf;
                }
                new CreateTodoModal(this.app, this).open();
            },
        });

        this.addSettingTab(new TodoModalPluginSettingsTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
