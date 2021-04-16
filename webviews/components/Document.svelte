<script lang="ts">
  let body: string;
  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent
    body = message.html;
  });
</script>

<div>
  {@html body}
</div>
