const module_name = "item_piles_bankers";
const module_path = `modules/${module_name}/`;
const flag = `flags.${module_name}`

const CONSTANTS = {

  MODULE_NAME: module_name,
  PATH: module_path,
  FLAG: flag,

  GET_VAULT_DEFAULTS: (bankerActor) => {
    const defaults = foundry.utils.duplicate(CONSTANTS.VAULT_DEFAULTS);
    defaults.vaultAccess[0].uuid = game.user.uuid;
    const flags = bankerActor.getFlag("item-piles", "data");
    defaults.cols = Math.max(1, flags?.bankerColumns ?? 12);
    defaults.rows = Math.max(1, flags?.bankerRows ?? 8);
    return defaults;
  },

  VAULT_DEFAULTS: {
    type: "vault",
    cols: 12,
    rows: 8,
    vaultExpansion: true,
    baseExpansionCols: 2,
    baseExpansionRows: 8,
    preventVaultAccess: true,
    vaultAccess: [{
      uuid: "",
      organize: true,
      items: {
        withdraw: true,
        deposit: true
      },
      currencies: {
        withdraw: true,
        deposit: true
      }
    }],
    logVaultActions: true,
    vaultLogType: "user"
  }

}

export default CONSTANTS;
