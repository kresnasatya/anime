<script>
	import Nav from "$lib/Nav.svelte";

    let { data } = $props();

    let content = data.content;
    let metadata = data.metadata;
</script>

<svelte:head>
    <title>About - anime.kresna.me</title>
    <meta name="description" content="About this site.">
</svelte:head>

<div style="text-align: center;">
    <h1><a href="/">anime.kresna.me</a></h1>
    <Nav />
    <p>Let's nostalgia together! 📻🎼🎼</p>
</div>

{@html content}