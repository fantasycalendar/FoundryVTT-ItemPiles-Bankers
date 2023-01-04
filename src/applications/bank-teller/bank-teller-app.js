import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import BankTellerShell from "./bank-teller-shell.svelte";
import * as lib from "../../lib.js";

export default class BankTellerApp extends SvelteApplication {

  /**
   * @param options
   * @param dialogData
   */
  constructor(options = {}, dialogData = {}) {
    super({
      id: `item-piles-bankers-${options.bankerActor?.id}-${randomID()}`,
      title: options.bankerActor.name,
      svelte: {
        class: BankTellerShell,
        target: document.body,
      },
      zIndex: 100,
      ...options,
      top: window.innerHeight / 1.75,
    }, {
      ...dialogData
    });
  }

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      closeOnSubmit: false,
      classes: ["app window-app sheet item-piles-bankers"],
      resizable: false,
      width: 400,
      height: "auto"
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
