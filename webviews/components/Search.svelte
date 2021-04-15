<script lang="ts">
  let text: string;
  let title: string = "";
  let excerpt: string = "";
  let value: string = "";
  let timer: any;

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
      value: text,
    });
  };

  const debounce = (e: Event) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      openSearchPanel();
    }, 1000);
  };

  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent
    console.log(message);
    title = message["response"]["results"][0]["title"];
    excerpt = message["response"]["results"][0]["excerpt"];
  });
</script>

<div class="desciptor">Enter keyword to search</div>
<div class="search-input">
  <input bind:value={text} on:keyup={debounce} />
</div>
<div class="results">
  Search results for {text}...

  <h2>
    {@html title
      .replaceAll("@@@hl@@@", "<strong>")
      .replaceAll("@@@endhl@@@", "</strong>")}
  </h2>
  <h4>
    {@html excerpt
      .replaceAll("@@@hl@@@", "<strong>")
      .replaceAll("@@@endhl@@@", "</strong>")}
  </h4>
</div>

<style>
  div {
    margin-top: 100pt;
    margin-bottom: 100pt;
  }
</style>
