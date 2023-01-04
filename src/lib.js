import CONSTANTS from "./constants.js";
import BankTellerApp from "./applications/bank-teller/bank-teller-app.js";

export function bankTellerClicked(itemPile, playerActor){

  const itemPileActor = itemPile.actor;

  if(!itemPileActor.getFlag(CONSTANTS.MODULE_NAME, 'bankTeller')) return true;

  if(!playerActor){
    itemPileActor.sheet.render(true);
    return false;
  }

  const bankVault = game.actors.find(actor => actor.getFlag(CONSTANTS.MODULE_NAME, 'vaultUserId') === game.user.id);

  if(bankVault){
    game.itempiles.API.renderItemPileInterface(bankVault, { inspectingTarget: playerActor });
  }else{
    BankTellerApp.show({ bankerActor: itemPileActor, playerActor });
  }

  return false;

}


export function getActiveApps(id, single = false) {
  const apps = Object.values(ui.windows).filter(app => app.id.startsWith(id) && app._state > Application.RENDER_STATES.CLOSED);
  if (single) {
    return apps?.[0] ?? false;
  }
  return apps;
}


export async function createNewAccount(playerActor){

  let bankVault = game.actors.find(actor => actor.getFlag(CONSTANTS.MODULE_NAME, 'vaultUserId') === game.user.id);

  if(!bankVault) {

    const result = await game.itempiles.API.createItemPile({
      actor: game.user.name + "'s Vault",
      createActor: true,
      folder: "Bank Vaults",
      itemPileFlags: CONSTANTS.VAULT_DEFAULTS(playerActor),
      actorOverrides: {
        [CONSTANTS.FLAG + ".vaultUserId"]: game.user.id
      }
    });

    if (!result.actorUuid) return false;

    bankVault = fromUuidSync(result.actorUuid);

    if(!bankVault) return false;

  }

  game.itempiles.API.renderItemPileInterface(bankVault, { inspectingTarget: playerActor });

  return true;

}
