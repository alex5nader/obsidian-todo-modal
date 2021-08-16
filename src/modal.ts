import {App, Modal, normalizePath, Setting} from "obsidian";
import TodoModalPlugin from "./main";

export class CreateTodoModal extends Modal {
    plugin: TodoModalPlugin;

    constructor(app: App, plugin: TodoModalPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        this.contentEl.createEl("h2", {text: "New Todo"});

        this.contentEl.createEl("form", {}, (form) => {
            let title = "";
            new Setting(form)
                .setName("Title")
                .addText(text => {
                    text.onChange(value => title = value);

                    window.setTimeout(() => text.inputEl.focus(), 10);
                });

            let group = "0";
            new Setting(form)
                .setName("Group")
                .addDropdown(drop => {
                    this.plugin.settings.groups.forEach((group, idx) => {
                        drop.addOption(idx.toString(), group);
                    });
                    drop.setValue(group);

                    drop.onChange(value => group = value);
                });

            let priority = this.plugin.settings.defaultPriority.toString();
            new Setting(form)
                .setName("Priority")
                .addDropdown(drop => {
                    this.plugin.settings.priorities.forEach((priority, idx) => {
                        drop.addOption(idx.toString(), priority);
                    });
                    drop.setValue(priority);

                    drop.onChange(value => priority = value);
                });

            let dueDate = "";
            let dueDatePreview: HTMLElement;
            const dueDateInput = new Setting(form)
                .setName("Due By")
                .addText(text => {
                    text.onChange(value => {
                        dueDate = value;

                        dueDatePreview.setText(dueDate);
                    });
                });
            dueDatePreview = dueDateInput.descEl;

            form.createDiv("modal-button-container", container => {
                container
                    .createEl("button", { attr: { type: "button" }, text: "Cancel" })
                    .addEventListener("click", () => this.close());

                container.createEl("button", { attr: { type: "submit" }, cls: "mod-cta", text: "Create Todo" });
            });

            form.addEventListener("submit", async (evt) => {
                evt.preventDefault();

                this.close();

                const content =
`---
done: false
group: ${this.plugin.settings.groups[Number.parseInt(group)]}
priority: ${this.plugin.settings.priorities[Number.parseInt(priority)]}
due-by: ${dueDate}
---

`

                const path = normalizePath(this.plugin.settings.todoPath + "/" + title + ".md");
                console.log(path);
                const file = await this.app.vault.create(
                    path,
                    content
                );

                await this.app.workspace.getLeaf(false).openFile(file, {
                    active: true,
                    state: {mode: "source"},
                });
            })
        });
    }
}