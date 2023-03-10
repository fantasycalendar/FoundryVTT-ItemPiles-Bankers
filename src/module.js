import "./styles/styles.scss";
import * as lib from "./lib.js";
import BankerSocket from "./sockets.js";

Hooks.once('item-piles-ready', async function() {

  Hooks.on(game.itempiles.hooks.PILE.PRE_CLICK, lib.bankTellerClicked);
  Hooks.on(game.itempiles.hooks.PILE.PRE_DIRECTORY_CLICK, lib.bankTellerClicked);
  Hooks.on(game.itempiles.hooks.PILE.PRE_RIGHT_CLICK_ITEM, lib.vaultItemRightClicked);

  game.itempiles.API.registerItemPileType("banker", "Banker", {
    maxVaults: {
      title: "Max Vaults",
      label: "This is how many vaults a single user can have with this bank",
      type: Number,
      value: 1
    },
    vaultCostFormula: {
      title: "Vault Cost Formula",
      label: "This is how much each vault costs in gold - the formula can contain \"@vaults\", which is how many vaults the user has",
      type: String,
      value: "(@vaults+1)*50"
    },
  });

  BankerSocket.initialize();

});
