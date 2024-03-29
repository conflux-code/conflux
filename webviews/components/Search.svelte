<script lang="ts">
  let text: string;
  let timer: any;
  let results: any[] = [];
  let baseUrl = "";
  let cql: boolean = false;
  let cached: boolean = false;
  let loading: boolean = false;

  const openSearchPanel = () => {
    if (text.length <= 2) {
      tsvscode.postMessage({
        type: "onInfo",
        value: "More than 2 chars needed!",
      });
      loading = false;
      return;
    }
    tsvscode.postMessage({
      type: "doSearch",
      value: { text, cql },
    });
  };

  const debounce = (e: Event) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      results = [];
      loading = true;
      openSearchPanel();
    }, 1000);
  };

  const renderDocument = (result: any) => {
    const id = result.content.id;
    tsvscode.postMessage({
      type: "renderDocument",
      value: { id },
    });
  };

  const reloadResults = (e: Event) => {
    results = [];
    loading = true;
    tsvscode.postMessage({
      type: "doSearch",
      value: { text, cql, reload: true },
    });
  };

  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent
    results = Object.values(message.response.results);
    baseUrl = message.response._links.base;
    cached = !(message.cached === undefined);
    loading = false;
  });
</script>

<div class="search-input">
  <div class="desciptor">Enter keyword to search</div>
  <div class="search-input-input-div">
    <input type="text" bind:value={text} on:keyup={debounce} />
  </div>
  <label>
    <input type="checkbox" bind:checked={cql} label="CQL" />
    CQL Enabled
  </label>
  <br />
  <br />
  {#if !loading}
    {#if text !== undefined}
      {#if cached}
        <div class="cache-header">
          Showing cached results.
          <button class="link-text" on:click={reloadResults}
            >Fetch latest?</button
          >
        </div>
      {/if}
    {/if}
  {:else}
    <div class="loader-ring">
      <div class="loader-ring-light" />
      <div class="loader-ring-track" />
    </div>
  {/if}
</div>
<br />
<div class="multi-result">
  {#each results as result}
    <div class="title-line">
      <button class="secondary title" on:click={() => renderDocument(result)}>
        <h3>
          {@html result.title
            .replaceAll("@@@hl@@@", "<em>")
            .replaceAll("@@@endhl@@@", "</em>")}
        </h3>
      </button>

      <div class="subtitle">
        {@html result.excerpt
          .replaceAll("@@@hl@@@", "<strong>")
          .replaceAll("@@@endhl@@@", "</strong>")}
      </div>
      {#if result.isOffline}
        <div class="option-line">[ Offline &#x2714 ]</div>
      {:else}
        <div class="option-line option-line-offline">[ Offline &#x2718 ]</div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .title {
    font-weight: bold;
  }
  .title-line {
    overflow: hidden;
    white-space: nowrap;
  }
  .option-line {
    font-size: smaller;
    margin-bottom: 20px;
    float: right;
    color: var(--vscode-button-background);
  }

  .option-line-offline {
    color: var(--vscode-button-secondaryBackground);
  }

  button.link-text {
    width: 30% !important;
    margin-left: 5%;
  }

  button.title {
    text-align: start;
    margin: 1px 1px;
  }
  div.subtitle {
    margin-bottom: 2px;
    padding: 4px 4px;
    word-wrap: break-word;
    width: 90%;
    white-space: normal;
  }
  input {
    margin-bottom: 5px;
  }
</style>
