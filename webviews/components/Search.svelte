<script lang="ts">
  let text: string;

  // const openDocumentView = (uriString: string) => {
  //   const uri = Uri.file(vscode.env.uriScheme);
  // };
</script>

<div class="desciptor">Enter keyword to search</div>
<div class="search-input">
  <input bind:value={text} />
</div>
<div class="results">
  Search results for {text}...
</div>

<style>
  div {
    margin-top: 100pt;
    margin-bottom: 100pt;
  }
</style>
