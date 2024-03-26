import { SvelteApplication } from '#runtime/svelte/application';
import BankTellerShell from "./bank-teller-shell.svelte";
import * as lib from "../../lib.js";

export default class BankTellerApp extends SvelteApplication {

  constructor(options, dialogOptions) {
    super({
      id: `item-piles-bankers-${options.bankerActor?.id}-${randomID()}`,
      title: options.bankerActor.name,
      ...options,
    }, dialogOptions);
  }

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      svelte: {
        class: BankTellerShell,
        target: document.body,
      },
      classes: ["app window-app sheet item-piles-bankers"],
      zIndex: 100,
      width: 450,
      height: "auto",
      closeOnSubmit: false,
      resizable: false,
      top: window.innerHeight / 1.75,
    });
  }

  static getActiveApp(id = "") {
    return lib.getActiveApps(`item-piles-bankers-${id}`, true);
  }

  static async show(options = {}, dialogData = {}) {
    const app = this.getActiveApp(options.bankerActor.id);
    if (app) {
      app.render(false, { focus: true });
      return;
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(options, dialogData).render(true, { focus: true });
    })
  }

}
