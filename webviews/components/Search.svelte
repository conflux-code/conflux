<script lang="ts">
  let text: string;
  let timer: any;
  let results: any[] = [];
  let baseUrl = "";
  let cql: boolean = false;

  const openSearchPanel = () => {
    if (text.length <= 2) {
      tsvscode.postMessage({
        type: "onInfo",
        value: "More than 2 chars needed!",
      });
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
      openSearchPanel();
    }, 1000);
  };

  const renderDocument = (result: any) => {
    tsvscode.postMessage({
      type: "renderDocument",
      value: result.content.id,
    });
  };

  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent
    results = Object.values(message.response.results);
    baseUrl = message.response._links.base;
    console.log(baseUrl);
    console.log(results);
  });
</script>

<div class="desciptor">Enter keyword to search</div>
<div class="search-input">
  <input bind:value={text} on:keyup={debounce} />
  {#if text !== undefined}
    Search results for {text}...
  {/if}
</div>
<label>
  <input type="checkbox" bind:checked={cql} label="CQL" />
  CQL Enabled
</label>
<div class="multi-result">
  {#each results as result}
    <div class="result">
      <div class="title-line">
        <a on:click={() => renderDocument(result)}>
          <h3 class="title">
            {@html result.title
              .replaceAll("@@@hl@@@", "<em>")
              .replaceAll("@@@endhl@@@", "</em>")}
          </h3>
        </a>
      </div>
      <div class="option-line">
        [ <a href="{baseUrl}{result.url}">Open in browser</a> ] [Cached &#x2713;
        &#x2717;]
      </div>
      {@html result.excerpt
        .replaceAll("@@@hl@@@", "<strong>")
        .replaceAll("@@@endhl@@@", "</strong>")}
    </div>
  {/each}
</div>

<style>
  div.result {
    padding: 5pt;
  }
  .title {
    font-weight: bold;
  }
  .title-line {
    overflow: hidden;
    white-space: nowrap;
  }
  .option-line {
    font-size: smaller;
  }
</style>
