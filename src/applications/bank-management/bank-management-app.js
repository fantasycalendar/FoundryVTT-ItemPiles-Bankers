import { SvelteApplication } from '#runtime/svelte/application';
import BankManagementShell from "./bank-management-shell.svelte";
import * as lib from "../../lib.js";

export default class BankManagementApp extends SvelteApplication {

  constructor(options, dialogOptions) {
    super({
      id: `item-piles-management-${options.bankerActor?.id}-${randomID()}`,
      title: options.bankerActor.name,
      ...options,
    }, dialogOptions);
  }

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      svelte: {
        class: BankManagementShell,
        target: document.body,
      },
      classes: ["app window-app sheet item-piles-bankers"],
      zIndex: 100,
      width: 900,
      height: 500,
      closeOnSubmit: false,
      resizable: true
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

  /** @override */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    const canConfigure = game.user.isGM;
    if (canConfigure) {
      buttons = [
        {
          label: !lib.getItemPileSetting("hideActorHeaderText") ? "ITEM-PILES.Inspect.OpenSheet" : "",
          class: "item-piles-open-actor-sheet",
          icon: "fas fa-user",
          onclick: () => {
            this.options.bankerActor.sheet.render(true, { focus: true, bypassItemPiles: true });
          }
        },
        {
          label: !lib.getItemPileSetting("hideActorHeaderText") ? "ITEM-PILES.HUD.Configure" : "",
          class: "item-piles-configure-pile",
          icon: "fas fa-box-open",
          onclick: () => {
            game.itempiles.apps.ItemPileConfig.show(this.options.bankerActor);
          }
        },
      ].concat(buttons);
    }
    return buttons
  }

}
