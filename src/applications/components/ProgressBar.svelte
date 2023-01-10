<script>
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  export let text;
  export let progress = 0;

  export let progressBar = tweened(0, {
    duration: 400,
    easing: cubicOut,
  });

  $: progress, updateProgress();

  function updateProgress() {
    progressBar.set(progress);
  }

</script>

<div class="progressbar">
  <div class="progress" style="width:{$progressBar*100}%;"></div>
  {#if text}
    <div class="overlay">{text}</div>
  {/if}
</div>

<style lang="scss">

  .progressbar {
    width: 100%;
    height: 20px;
    border-radius: 5px;
    overflow: hidden;
    background-color: #a7a7a7;

    > div {
      height: 100%;
    }

    .progress {
      z-index: 2;
      background-color: #199a2b;
      position: relative;
    }

    .overlay {
      z-index: 3;
      position: relative;
      top: -20px;
      text-align: center;
      color: white;
      width: 100%;
      box-shadow: 0 0 2px 2px inset rgb(0 0 0 / 25%);
      line-height: 20px;
    }
  }

</style>
