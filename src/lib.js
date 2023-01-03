import CONSTANTS from "./constants.js";

export function bankTellerClicked(itemPile, inspectingActor){

  const itemPileActor = itemPile.actor;

  if(!itemPileActor.getFlag(CONSTANTS.MODULE_NAME, 'bankTeller')) return true;

  if(!inspectingActor){
    itemPileActor.sheet.render(true);
    return false;
  }

  const bankVault = game.actors.find(actor => actor.getFlag(CONSTANTS.MODULE_NAME, 'vaultUserId') === game.user.id);

  if(bankVault){
    game.itempiles.API.renderItemPileInterface(bankVault, { inspectingTarget: inspectingActor });
  }

  return false;

}
