<script>

  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
  import { getContext } from 'svelte';
  import * as lib from "../../lib.js";
  import CreateNewVaultDialog from "../components/CreateNewVaultDialog.svelte";
  import BankerSocket from "../../sockets.js";

  const { application } = getContext('#external');

  export let elementRoot;

  const { bankerActor } = application.options;
  const playerActor = game.user.character;

  const flags = bankerActor.getFlag("item-piles", 'data');
  const maxVaults = flags.maxVaults;
  const { vaultPrice, canBuy } = lib.getCostOfVault(bankerActor, playerActor);
  let currentVaults = getCurrentVaults();
  let selectedVault = currentVaults[0]?.id ?? "new";

  let hasButtonBeenPressed = false;

  function getCurrentVaults() {
    return lib.getVaults({ bankerActor, userId: game.user.id }).map(vault => ({
      id: vault.id,
      uuid: vault.uuid,
      name: vault.name
    }));
  }

  function buttonPressed() {
    hasButtonBeenPressed = true;
    if (selectedVault === 'new') {
      return createNewVault();
    }
    const vault = currentVaults.find(actor => actor.id === selectedVault);
    return openVault(vault);
  }

  function openVault(vault) {
    if (!vault) return;
    game.itempiles.API.renderItemPileInterface(vault.uuid, { inspectingTarget: playerActor });
    application.close();
  }

  async function createNewVault() {

    hasButtonBeenPressed = true;

    const result = await new Promise(resolve => {
      let options = { resolve };
      new TJSDialog({
        title: "Purchase new vault",
        content: {
          class: CreateNewVaultDialog,
        },
        label: "Okay",
        modal: true,
        draggable: false,
        autoClose: true,
        close: () => options.resolve?.(null)
      }, options).render(true);
    });

    hasButtonBeenPressed = false;

    if (!result) return;

    const vault = await lib.createNewVault(
      bankerActor,
      result
    );
    return openVault(vault);
  }

  async function renameVault() {

    hasButtonBeenPressed = true;

    const vault = currentVaults.find(actor => actor.id === selectedVault);
    const result = await new Promise(resolve => {
      let options = { resolve };
      new TJSDialog({
        title: "Rename vault",
        content: {
          class: CreateNewVaultDialog,
          props: {
            vaultName: vault.name
          }
        },
        label: "Rename",
        modal: true,
        draggable: false,
        autoClose: true,
        close: () => options.resolve?.(null)
      }, options).render(true);
    });

    hasButtonBeenPressed = false;

    if (!result || result === vault.name) return;

    await BankerSocket.FUNCTIONS.RENAME_VAULT(vault, result);

    currentVaults = getCurrentVaults();

  }

  const maxVaultWarning = currentVaults.length >= maxVaults ? `You have reached the maximum number of vaults (${maxVaults}) at this bank.` : "";

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <div style="text-align: center;" class="item-piles-bottom-divider">
    <p>Welcome to <strong>{bankerActor.name}</strong>, {playerActor.name}!</p>
    <p>
      {#if !currentVaults.length}
        <span>
        {#if canBuy}
          {#if vaultPrice}
            I see you don't have an account with us yet, would you like to purchase a vault at our establishment for a
            mere <strong>{vaultPrice}</strong>?
          {:else}
            I see you don't have an account with us yet, opening your first vault is free!
          {/if}
        {:else}
          I see you don't have an account with us yet, but I'm afraid you need at least <strong>{vaultPrice}</strong> to
          purchase a vault.
        {/if}
        </span>
      {:else}
        How can we help you today?
      {/if}
    </p>
  </div>

  {#if currentVaults.length}

    <div class="item-piles-flexrow">

      <select bind:value={selectedVault} style="flex: 1 0 auto;">
        {#each currentVaults as vault (vault.id)}
          <option value={vault.id}>{vault.name}</option>
        {/each}
        {#if currentVaults.length < maxVaults}
          <option value="new" disabled={!canBuy || currentVaults.length >= maxVaults}>
            <span>
              New Vault
              {#if vaultPrice}
                ({vaultPrice}{!canBuy ? " - can't afford" : ""})
              {/if}
            </span>
          </option>
        {/if}
      </select>

      <button type="button" style="flex: 0 1 30%; width: auto; line-height: inherit;"
							:disabled={hasButtonBeenPressed}
              on:click={() => buttonPressed()}
      >
        {selectedVault === "new" ? "Purchase new vault" : "Open vault"}
      </button>

      {#if selectedVault !== "new"}
        <button type="button" style="flex: 0 1 10%; width: auto; line-height: inherit;"
								:disabled={hasButtonBeenPressed}
                on:click={() => renameVault()}

        >
          Rename
        </button>
      {/if}

    </div>

  {:else}

    <button type="button" style="font-size:1.25rem; line-height: inherit; padding: 0.5rem 0;"
						:disabled={hasButtonBeenPressed}
            on:click={() => buttonPressed()} disabled={!canBuy}>
      {vaultPrice ? "Purchase" : "Open"} first vault
      {#if vaultPrice}
        ({vaultPrice}{!canBuy ? " - can't afford" : ""})
      {/if}
    </button>

  {/if}

  {#if maxVaultWarning}
    <div class="item-piles-top-divider">
      <div style="background-color: #2971d5;" class="notification">
        {maxVaultWarning}
      </div>
    </div>
  {/if}

</ApplicationShell>

<style lang="scss">

  p {
    margin-bottom: 0;
  }

</style>
