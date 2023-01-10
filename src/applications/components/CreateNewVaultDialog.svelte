<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { get, writable } from "svelte/store";
  import * as lib from "../../lib.js";

  const { application } = getContext('external');

  export let form;

  const existingVaultNames = lib.getVaults({ userId: game.user.id }).map(a => a.name.toLowerCase());

  let vaultName = `${game.user.name}'s Vault`;

  if(!vaultName.includes(game.user.name)){
    vaultName = game.user.name + " - " + vaultName;
  }
  const numberOfSameVaults = existingVaultNames.filter(name => name.startsWith(vaultName.toLowerCase())).length;
  if(numberOfSameVaults){
    vaultName += " " + (numberOfSameVaults+1);
  }

  const newVaultName = writable(vaultName);

  $: trimmedName = $newVaultName.trim();
  $: emptyName = trimmedName === "";
  $: nameExists = existingVaultNames.indexOf(trimmedName.toLowerCase()) > -1;

  export async function requestSubmit() {
    form.requestSubmit();
  }

  export async function purchaseVault() {
    application.options.resolve(trimmedName);
    application.close();
  }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={purchaseVault} autocomplete=off class="dialog-content">

  <div class="form-control">
    <label>Enter new vault name:</label>
    <input type="text" autofocus bind:value={$newVaultName}/>
  </div>

  {#if emptyName}
    <div class="notification error">Your new vault name cannot be empty!</div>
  {:else if nameExists}
    <div class="notification error">Your new vault cannot have the same name as one you already own!</div>
  {/if}

  <footer class="item-piles-flexrow">
    <button type="button" disabled={emptyName || nameExists} on:click={requestSubmit}>
      {localize("Okay")}
    </button>
    <button type="button" on:click={() => { application.options.resolve(null); application.close(); }}>
      {localize("Cancel")}
    </button>
  </footer>

</form>

<style lang="scss">

  .notification {
    margin-top: 1rem;
    padding: 0.5rem;
    opacity: 1.0;
    color: white;
  }

  .form-control {
    margin: 0.5rem 0;
  }

  footer {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(0, 0, 0, 0.25);
  }

</style>
