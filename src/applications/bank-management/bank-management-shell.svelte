<script>

  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import { TJSDocument } from '@typhonjs-fvtt/runtime/svelte/store';
  import { getContext, onDestroy, onMount } from 'svelte';
  import * as lib from "../../lib.js";
  import { get, writable } from "svelte/store";
  import DropZone from "../components/DropZone.svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import CONSTANTS from "../../constants.js";
  import ProgressBar from "../components/ProgressBar.svelte";
  import { TJSProseMirror } from "@typhonjs-fvtt/svelte-standard/component/dev";

  const { application } = getContext('external');

  export let elementRoot;

  const { bankerActor } = application.options;

  let showProgressBar = false;
  let progress = 0;
  let progressText = "";
  let vaultDescription = "";

  const doc = new TJSDocument(bankerActor);
  $: {
    $doc;
    const flags = game.itempiles.API.getActorFlagData(bankerActor);
    vaultDescription = flags?.description !== "<p></p>" ? flags.description : "";
  }

  let bankVaults = [];

  const itemsToAdd = writable([]);
  const currenciesToAdd = writable(game.itempiles.API.CURRENCIES.map(currency => {
    currency.quantity = 0;
    return currency;
  }));

  const vaults = writable(getVaultData(false));

  let minVaultSpaces = 0;

  $: totalItems = $itemsToAdd.length;
  $: hasCurrency = $currenciesToAdd.some(currency => currency.quantity);
  $: spaceLeft = minVaultSpaces - $itemsToAdd.length;
  $: canSendToVaults = hasCurrency || (totalItems && spaceLeft >= 0);

  recalculateMinVaultSpaces();

  function getVaultData(keepOld = true) {

    const oldData = keepOld ? get(vaults) : [];

    bankVaults = lib.getVaults({ bankerActor });

    return bankVaults.reduce((acc, vault) => {

      const userId = vault.getFlag(CONSTANTS.MODULE_NAME, 'vaultUserId');
      const user = game.users.get(userId);
      const vaultGridData = game.itempiles.API.getVaultGridData(vault);
      const existingPlayer = acc.find(v => v.userId === userId);

      if (keepOld) {
        const existingVault = existingPlayer.vaults.find(v => v.actor.id === vault.id);
        existingVault.vaultGridData = vaultGridData;
        return acc;
      }

      if (existingPlayer) {
        existingPlayer.vaults.push({
          sendTo: !existingPlayer.hasAssignedVault && !!vaultGridData.freeSpaces,
          actor: vault,
          vaultGridData
        });
        existingPlayer.hasAssignedVault = existingPlayer.hasAssignedVault || !!vaultGridData.freeSpaces;
      } else {
        acc.push({
          userId,
          user,
          hasAssignedVault: !!vaultGridData.freeSpaces,
          vaults: [{
            sendTo: !!vaultGridData.freeSpaces,
            actor: vault,
            vaultGridData
          }]
        })
      }
      return acc;
    }, oldData)
  }

  function recalculateMinVaultSpaces() {
    minVaultSpaces = get(vaults).reduce((acc, vaultCollection) => {
      return Math.min(acc, vaultCollection.vaults.reduce((vacc, vault) => {
        return vault.sendTo ? Math.min(vault.vaultGridData.freeSpaces, vacc) : vacc;
      }, Infinity));
    }, Infinity);
  }

  async function onDropData(data) {

    if (data.type !== "Item") {
      ui.notifications.warn(`You must drop items, not "${data.type.toLowerCase()}"!`)
      return false;
    }

    if (spaceLeft <= 0) return;

    const item = await Item.implementation.fromDropData(data);

    const itemData = item.toObject();

    const disallowedType = game.itempiles.API.isItemInvalid(itemData);
    if (disallowedType) {
      ui.notifications.warn(`You cannot add items of type "${disallowedType}", it is not considered a valid item!`)
      return false;
    }

    itemsToAdd.update(items => {
      const existingItem = items.find(i => i.data._id === itemData._id || (i.data.name === itemData.name && i.data.type === itemData.type))
      if (existingItem) {
        existingItem.quantity++;
      } else {
        items.push({
          id: randomID(),
          canStack: game.itempiles.API.canItemStack(itemData),
          quantity: 1,
          data: itemData
        });
      }
      return items;
    });

  }

  function removeItem(index) {
    itemsToAdd.update(items => {
      items.splice(index, 1);
      return items;
    });
  }

  function openVault(vault) {
    game.itempiles.API.renderItemPileInterface(vault);
  }

  function onDragOver() {

  }

  function onDragLeave() {

  }

  async function sendToVaults() {

    const items = get(itemsToAdd).filter(item => item.quantity).map(item => ({
      item: item.data,
      quantity: item.quantity
    }));

    const currencyString = get(currenciesToAdd)
      .filter(item => item.quantity)
      .map(currency => currency.abbreviation.replace("{#}", currency.quantity))
      .join(" ");

    const vaultsToSendTo = get(vaults)
      .map(vaultUserCollection => vaultUserCollection.vaults
        .filter(vault => vault.sendTo)
        .map(vault => vault.actor)
      )
      .deepFlatten();

    showProgressBar = vaultsToSendTo.length > 20;
    progressText = `Vault 0 out of ${vaultsToSendTo.length} updated`;

    let index = 1;
    for (const vaultActor of vaultsToSendTo) {

      if (items.length) {
        await game.itempiles.API.addItems(vaultActor, items);
      }

      if (currencyString) {
        await game.itempiles.API.addCurrencies(vaultActor, currencyString);
      }

      progressText = `Vault ${index} out of ${vaultsToSendTo.length} updated`;
      progress = index / vaultsToSendTo.length;
      index++;

    }

    itemsToAdd.set([]);
    currenciesToAdd.set(game.itempiles.API.CURRENCIES.map(currency => {
      currency.quantity = 0;
      return currency;
    }));

    confirmSending = false;
    showProgressBar = false;
    progress = 0;

    vaults.set(getVaultData());

  }

  let confirmSending = false;

  const vaultSearch = writable("");

  $: visibleVaults = $vaults.filter(collection => collection.user.name.toLowerCase().includes($vaultSearch.toLowerCase()));

  let createHookId = false;
  let deleteHookId = false;
  onMount(() => {
    createHookId = Hooks.on("createItem", () => {
      vaults.set(getVaultData());
    });
    deleteHookId = Hooks.on("deleteItem", () => {
      vaults.set(getVaultData());
    });
  });

  onDestroy(() => {
    Hooks.off("createItem", createHookId);
    Hooks.off("deleteItem", deleteHookId);
  });


</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <DropZone callback={onDropData} overCallback={onDragOver} leaveCallback={onDragLeave}>

    {#if vaultDescription}
      <div class="item-piles-bottom-divider" style="padding-bottom:0;">
        <TJSProseMirror
          content={vaultDescription}
          options={{ editable: false }}
          style={{"display": "block"}}
        />
      </div>
    {:else}
      <div class="item-piles-bottom-divider" style="text-align: center;">
        <p>Welcome to <strong>{bankerActor.name}</strong>, {game.user.name}! How may we help you today?</p>
        <p>Our customers have opened a total of <strong>{bankVaults.length}</strong> vaults.</p>
      </div>
    {/if}

    <div class="item-piles-flexrow">

      <div class="item-piles-flexcol"
           style="flex: 0 1 40%; border-right: 1px solid rgba(0,0,0,0.25); margin-right: 0.25rem; padding-right: 0.25rem;">

        <input type="text" bind:value={$vaultSearch} style="flex: 0 1 auto; margin-bottom: 0.25rem;">

        <div style="max-height: 288px; overflow-y: scroll; padding-right: 0.25rem;">

          {#each visibleVaults as userCollection, index (userCollection.userId)}

            <div style="flex: 0 1 auto; margin-bottom: 0.5rem;">
              <div style="display:flex;">
                <strong style="flex:1;">{userCollection.user.name}</strong>
                {#if index === 0}
                  <strong style="text-align:right;">Slots</strong>
                {/if}
              </div>
              {#each userCollection.vaults as vault (vault.actor.id)}
                <div style="display: flex; flex:0 1 auto; align-items: center;">
                  <input type="checkbox"
                         bind:checked={vault.sendTo}
                         style="height:12px; padding: 0; margin: 0;"
                         on:change={() => recalculateMinVaultSpaces()}
                  />
                  <div style="display: flex; flex:1;">
                  <span style="flex:1;">
                    <a on:click={() => openVault(vault.actor)}>
                      {vault.actor.name}
                    </a>
                  </span>
                    <span>({vault.vaultGridData.freeSpaces}/{vault.vaultGridData.enabledSpaces})</span>
                  </div>
                </div>
              {/each}

            </div>

          {/each}

        </div>

      </div>

      <div class="item-piles-flexcol" style="max-height: 319px;">

        <div class="item-piles-bankers-item-container-list item-piles-bottom-divider" class:centered-flex={!$itemsToAdd.length}>

          {#if !$itemsToAdd.length}

            {#if spaceLeft}
              <i class="item-piles-bankers-no-items-text" style="flex: 0;">Drag and drop items to add them</i>
            {/if}
            <i class="item-piles-bankers-no-items-text" style="flex: 0;">
              You can send {spaceLeft > 0 ? spaceLeft : "no"} items to the selected vaults
            </i>

          {:else}

            <div style="margin-bottom: 0.25rem; flex: 0 1 auto;">
              <strong>Items to add</strong>
              <i class="item-piles-bankers-no-items-text" style=" margin-top: 0.25rem; align-self: flex-end;">
                - you can send {spaceLeft > 0 ? spaceLeft : "no"} more items
              </i>
            </div>

            <div class="item-piles-flexcol" style="overflow-y: scroll;">

              {#each $itemsToAdd as item, index (item.id)}

                <div class="item-piles-flexrow item-piles-item-row item-piles-even-color" style="flex: 0;">

                  <div class="item-piles-img-container">
                    <img class="item-piles-img" src="{item.data.img}"/>
                  </div>

                  <div class="item-piles-name">
                    <div class="item-piles-name-container">
                      <p>{item.data.name}</p>
                    </div>
                  </div>

                  {#if item.canStack}

                    <div class="item-piles-quantity-container" style="flex:2.5;">

                      <div class="item-piles-quantity-input-container">
                        <input class="item-piles-quantity" type="number" min="0" bind:value="{item.quantity}">
                      </div>

                    </div>

                  {/if}

                  <button type="button" on:click={() => removeItem(index)} class="item-piles-item-take-button">
                    {localize("ITEM-PILES.Merchant.RemoveItem")}
                  </button>

                </div>

              {/each}

            </div>

          {/if}

        </div>

        {#if $currenciesToAdd.length}

          <div class="item-piles-flexrow item-piles-bottom-divider" style="flex: 0; flex-wrap: nowrap;">

            {#each $currenciesToAdd as currency, index (index)}

              <div class="item-piles-flexrow" style="flex: 0 1 auto; flex-wrap: nowrap;" data-tooltip={currency.name}
                   data-tooltip-activation-speed="0" data-tooltip-deactivation-speed="0">

                <div class="item-piles-img-container">
                  <img class="item-piles-img" src="{currency.img}"/>
                </div>

                <div class="item-piles-quantity-container">

                  <div class="item-piles-quantity-input-container">
                    <input class="item-piles-quantity" type="number" min="0" bind:value="{currency.quantity}">
                  </div>

                </div>

              </div>

            {/each}

          </div>

        {/if}

        {#if !confirmSending}
          <button type="button" class="item-piles-bankers-button" style="flex: 0 1 auto;" disabled={!canSendToVaults}
                  on:click={() => { confirmSending = true; }}>
            Send {totalItems && hasCurrency ? "items and currencies" : (totalItems ? "items" : "currencies")} to vaults
          </button>
        {:else}
          <div class="item-piles-flexrow" style="flex: 0 1 auto;">
            <button type="button" class="item-piles-bankers-button" style="background-color: rgba(219,255,219,0.8);" disabled={!canSendToVaults}
                    on:click={() => sendToVaults()}>
              Confirm
            </button>
            <button type="button" class="item-piles-bankers-button" style="background-color: rgba(255,219,219,0.8);"
                    on:click={() => { confirmSending = false; }}>
              Cancel
            </button>
          </div>
        {/if}

        {#if showProgressBar}
          <div style="flex: 0; margin-top: 0.25rem;">
            <ProgressBar bind:progress bind:text={progressText}/>
          </div>
        {/if}
      </div>
    </div>

  </DropZone>

</ApplicationShell>
