const module_name = "item_piles_bankers";
const module_path = `modules/${module_name}/`;
const flag = `flags.${module_name}`

const CONSTANTS = {

  MODULE_NAME: module_name,
  PATH: module_path,
  FLAG: flag,

  VAULT_DEFAULTS: (playerActor) => ({
    type: "vault",
    cols: 12,
    rows: 8,
    vaultExpansion: true,
    baseExpansionCols: 2,
    baseExpansionRows: 8,
    preventVaultAccess: true,
    vaultAccess: [{
      uuid: playerActor.uuid,
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
  })

}

export default CONSTANTS;
