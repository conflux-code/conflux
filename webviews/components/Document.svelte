<script lang="ts">
  let loaded: boolean = false;
  let body: string;
  let title: string;
  let baseUrl: string;
  let pageUrl: string;
  window.addEventListener("message", (event) => {
    loaded = true;
    console.log(event);
    const message = event.data; // The JSON data our extension sent
    console.log(message);
    body = unescape(message.html);
    title = message.title;
    baseUrl = message.baseUrl;
    pageUrl = message.pageUrl;
  });
</script>

<div>
  {#if loaded}
    <base href={baseUrl} />
    <h1><a class="title-line" href="{baseUrl}{pageUrl}">{title}</a></h1>
    {@html body}
  {:else}
    <h1>Loading...</h1>
  {/if}
</div>
