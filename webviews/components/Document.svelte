<script lang="ts">
  let body: string;
  let title: string;
  let baseUrl: string;
  let pageUrl: string;
  window.addEventListener("message", (event) => {
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
  <base href={baseUrl} />
  <h1><a class="title-line" href="{baseUrl}{pageUrl}">{title}</a></h1>
  {@html body}
</div>
