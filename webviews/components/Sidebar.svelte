<script lang="ts">
  let loggedIn: Promise<boolean>;
  tsvscode.postMessage({
    type: "initializeLogInStatus",
    value: "",
  });
  const openSearchPanel = (e: MouseEvent) => {
    tsvscode.postMessage({
      type: "activateSearch",
      value: "",
    });
  };

  const logOut = (e: MouseEvent) => {
    tsvscode.postMessage({
      type: "logOut",
      value: "",
    });
  };

  const logIn = (e: MouseEvent) => {
    tsvscode.postMessage({
      type: "logIn",
      value: "",
    });
  };

  const clearCaches = (e: MouseEvent) => {
    tsvscode.postMessage({
      type: "clearCaches",
      value: "",
    });
  };

  window.addEventListener("message", (event) => {
    console.log("message is here", event);
    const message = event.data; // The JSON data our extension sent
    loggedIn = Promise.resolve(message.loggedIn);
  });
</script>
<div class = "wrap">
  <h1>Conflux</h1>
  <br>
  <br>
  {#await loggedIn then value}
    {#if value}
      <button class="search-btn" on:click={openSearchPanel}>Search</button>
      <button class="search-btn" on:click={logOut}>Logout</button>
    {:else}
      <button class="search-btn" on:click={logIn}>Initialize</button>
    {/if}
    <button class="search-btn" on:click={clearCaches}>Clear cache</button>
  {/await}
</div>
