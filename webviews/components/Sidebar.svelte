<script lang="ts">
  import { empty } from "svelte/internal";

  let todos = [];
  let count = 0;
  let result = "search";

  const mockSearch = () => {
    count++;
    result = "search" + count;
  };

  const onKeyPress = (e: KeyboardEvent) => {
    var keyCode = e.code || e.key;
    if (keyCode == "Enter") {
      mockSearch();
    }
  };

  const onMouseClick = (e: MouseEvent) => {
    mockSearch();
  };

  const openSearchPanel = (e: MouseEvent) => {
    tsvscode.postMessage({
      type: "activateSearch",
      value: "",
    });
  };
</script>

<div>Search Directly</div>
<input on:keypress={onKeyPress} />
<button on:click={onMouseClick}>Search</button>
<button>Reset Results</button>
<br />
<div>{result}</div>

<button on:click={openSearchPanel}> Search in panel </button>

<style>
  div {
    color: pink;
  }
</style>
