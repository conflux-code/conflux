<script lang="ts">
  let loaded: boolean = false;
  let cached: boolean = false;
  let body: string;
  let title: string;
  let baseUrl: string;
  let pageUrl: string;
  let id: string;

  const reloadDocument = (e: Event) => {
    tsvscode.postMessage({
      type: "reloadDocument",
      value: { id, reload: true },
    });
  };

  window.addEventListener("message", (event) => {
    loaded = true;
    const message = event.data; // The JSON data our extension sent
    if (message.image && message.imgId) {
      let divElement: HTMLElement | null = document.querySelector(
        `div[data-confluxId="${message.imgId}"]`
      );
      console.log(divElement);
      console.log(message.image);
      if(divElement !== null) {
        divElement.innerHTML = message.image;
      }
      return;
    }
    body = unescape(message.html);
    title = message.title;
    baseUrl = message.baseUrl;
    pageUrl = message.pageUrl;
    cached = !(message.cached === undefined);
    if (cached) {
      id = message.cached;
    }
  });
</script>

<div>
  {#if loaded}
    {#if cached}
      <div class="cache-header">
        <button class="link-text" on:click={reloadDocument}
          >Showing cached results. Fetch latest?</button
        >
      </div>
    {/if}
    <base href={baseUrl} />
    <br />
    <h1><a class="title-line" href="{baseUrl}{pageUrl}">{title}</a></h1>
    <div class="renderedDocument">
      {@html body}
    </div>
  {:else}
    <div class="loader-ring">
      <div class="loader-ring-light" />
      <div class="loader-ring-track" />
    </div>
  {/if}
</div>
