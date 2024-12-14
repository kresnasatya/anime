<script>
	import Nav from "$lib/Nav.svelte";

    let { data } = $props();

    let content = data.content;
    let metadata = data.metadata;
</script>

<svelte:head>
    <title>About - anime.kresna.me</title>
    <meta name="title" content="About - anime.kresna.me">
    <meta name="description" content="About anime.kresna.me.">
    <meta name="og:type" content="website">
    <meta name="og:title" content="About - anime.kresna.me">
    <meta name="og:description" content="About anime.kresna.me.">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="About - anime.kresna.me">
    <meta name="twitter:description" content="About anime.kresna.me.">
</svelte:head>

<div style="text-align: center;">
    <h1><a href="/">anime.kresna.me</a></h1>
    <Nav />
    <p>Let's nostalgia together! 📻🎼🎼</p>
</div>

{@html content}