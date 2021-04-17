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

{#await loggedIn then value}
  {#if value}
    <button on:click={openSearchPanel}>Search</button>
    <button on:click={logOut}>Logout</button>
  {:else}
    <button on:click={logIn}>Login</button>
  {/if}
  <button on:click={clearCaches}>Clear cache</button>
{/await}
