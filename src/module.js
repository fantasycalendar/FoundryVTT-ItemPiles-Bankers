import "./styles/styles.scss";
import * as lib from "./lib.js";

Hooks.once('init', async function() {

});

Hooks.once('item-piles-ready', async function() {
  registerHooks();
});

function registerHooks(){
  Hooks.on(game.itempiles.hooks.PILE.PRE_CLICK, lib.bankTellerClicked);
}

