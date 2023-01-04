<script>

  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import { getContext } from 'svelte';
  import * as lib from "../../lib.js";
  import CONSTANTS from "../../constants.js";

  const { application } = getContext('external');

  export let elementRoot;

  const paymentData = game.itempiles.API.getPaymentDataFromString(CONSTANTS.VAULT_COST, {
    target: application.options.playerActor
  });

  async function tryCreateNewAccount() {

    if(!paymentData.canBuy) return;

    await game.itempiles.API.removeCurrencies(application.options.playerActor, CONSTANTS.VAULT_COST);

    if(await lib.createNewAccount(application.options.playerActor)){
      application.close();
    }

  }

  let enabled = false;
  setTimeout(() => {
    enabled = true;
  }, 250)

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <div>

    <div style="text-align: center;" class="item-piles-bottom-divider">
      Welcome to <strong>[BANK NAME HERE]</strong>, {application.options.playerActor.name}! I see you don't have an account with us yet, would you like to open one?
    </div>

    <button type="button" style="height: 100px; font-size:1.25rem;" on:click={() => { tryCreateNewAccount() }} disabled={!enabled || !paymentData.canBuy}>
      <p style="margin: 0.25rem;"><i class="fas fa-plus"></i> Open New Account ({CONSTANTS.VAULT_COST})</p>
      {#if !paymentData.canBuy}
        <i style="font-size: 0.85rem;">You cannot afford this</i>
      {/if}
    </button>

  </div>

</ApplicationShell>
