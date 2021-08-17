import {App, Modal, moment, normalizePath, Setting} from "obsidian";
import TodoModalPlugin from "./main";

import nlp from "compromise";
import nlpNumbers from "compromise-numbers";
import nlpDates from "compromise-dates";
//@ts-ignore
import nlpKeypress from "compromise-keypress";

nlp.extend(nlpNumbers);
nlp.extend(nlpDates)
nlp.extend(nlpKeypress);

type DateRangeSelector = "start" | "end";
type DateRange = {
    [selector in DateRangeSelector]: string;
};

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

            let rangeSelector: DateRangeSelector = "start";
            //@ts-ignore // plugins dont work nice with typescript
            let dueDate: DateRange | undefined = undefined;
            let dueDatePreview: HTMLElement;
            function updatePreview() {
                console.log(dueDate);
                dueDatePreview.setText(moment(dueDate[rangeSelector]).format("YYYY-MM-DD, HH:mm"));
            }

            new Setting(form)
                .setName("Start or end?")
                .addToggle(toggle => {
                    toggle.toggleEl.classList.add("tmp-labelled-toggle");

                    toggle.setValue(false);
                    toggle.onChange(value => {
                        if (value) {
                            rangeSelector = "end";
                        } else {
                            rangeSelector = "start";
                        }
                        updatePreview();
                    });

                    const parent = toggle.toggleEl.parentElement;
                    const startEl = parent.createEl("span", {text: "start"});
                    const endEl = parent.createEl("span", {text: "end"});
                    parent.setChildrenInPlace([startEl, toggle.toggleEl, endEl]);
                });

            let dueDateText: string = "";
            const dueDateInput = new Setting(form)
                .setName("Due By")
                .addText(text => {
                    text.onChange(value => {
                        dueDateText = value;
                        //@ts-ignore // plugins dont work nice with typescript
                        dueDate = nlp(dueDateText).dates().json(0);

                        if (!dueDate) {
                            dueDatePreview.setText("Invalid");
                        } else {
                            updatePreview();
                        }
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

                let dueBy: string | undefined;
                if (dueDate) {
                    dueBy = moment(dueDate[rangeSelector]).format("YYYY-MM-DD[T]HH:mm:ss");
                } else if (dueDateText) {
                    dueBy = dueDateText;
                } else {
                    dueBy = undefined;
                }

                const content = new FrontMatterBuilder()
                    .add("done", "false")
                    .add("group", this.plugin.settings.groups[Number.parseInt(group)])
                    .add("priority", this.plugin.settings.priorities[Number.parseInt(priority)])
                    .add("due-by", dueBy)
                    .build() + "\n\n";

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

class FrontMatterBuilder {
    entries: Map<string, string> = new Map<string, string>()

    add(key: string, value: string | undefined): this {
        if (!value) {
            return this;
        }

        this.entries.set(key, value);

        return this;
    }

    build(): string {
        if (this.entries.size == 0) {
            return "";
        }

        let result = "---";

        for (const [key, value] of this.entries) {
            result += `\n${key}: ${value}`
        }

        return result + "\n---";
    }
}
