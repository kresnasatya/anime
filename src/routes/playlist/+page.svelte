<script>
	import { page } from '$app/stores';
	import { formatTime, LOOP_CURRENT_VIDEO, LOOP_PLAYLIST, NO_LOOP } from '$lib/util.js';
	import Nav from '$lib/Nav.svelte';

	let { data } = $props();

	let youtubeAPIReady = $state(false);
	/** @type {YT.Player | undefined} */
	let player = $state();
	let ostIndex = $state(0);
	let progressCurrentTime = $state(0);
	let videoCurrentTime = $state('0:00');
	let videoDuration = $state('0:00');
	let currentSpeed = $state(1);
	let loopMode = $state(0);
	let toggleVideoPlaybackText = $state('Play');
	let toggleLoopText = $state('No Looping');

	let searchMode = $state('jump'); // jump or filter
	let searchTerm = $state(''); // for filter

	/** @type {Array<{title: string, id: string}>} */
	let playlist = $derived(data.playlist ?? []);
	let filteredPlaylist = $derived(playlist?.filter(ost => {
		return ost.title.toLowerCase().includes(searchTerm.toLowerCase());
	}));

	/** @type {number | undefined } */
	let intervalId;

	/**
	 * @type {HTMLUListElement}
	 */
	let playlistContainer;

	/**
	 * @type {HTMLLIElement[]}
	 */
	// TODO: I think we need to improve this approach because if we use this way, it will lead to increase memory in array.
	// Let's say the total ost is 1000, then it means the array needs to reserve a certain amount of
	// memory to store 1000 ost which is quite a big.
	let ostRefs = $state([]);

	function loadYouTubeAPI() {
		return new Promise((resolve) => {
			if (window.YT && window.YT.Player) {
				youtubeAPIReady = true;
				resolve();
				return;
			}

			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';

			const target = document.body;
			target.parentNode?.insertBefore(tag, target);

			window.onYouTubeIframeAPIReady = () => {
				youtubeAPIReady = true;
				resolve();
			};
		});
	}

	function createPlayer(ostIndex = 0) {
		if (!youtubeAPIReady) return;

		if (!player) {
			player = new YT.Player('player', {
				height: '320',
				width: '640',
				videoId: playlist[ostIndex].id,
				host: 'https://www.youtube-nocookie.com',
				playerVars: {
					controls: 0 // Hide the default YouTube player controls.
				},
				events: {
					onReady: onPlayerReady,
					onStateChange: onPlayerStateChange
				}
			});
		}
	}

	$effect(() => {
		loadYouTubeAPI().then(() => {
			if ($page.url.searchParams.get('v')) {
				let videoId = $page.url.searchParams.get('v');
				for (let i = 0; i < playlist.length; i++) {
					const ost = playlist[i];
					if (ost.id === videoId) {
						ostIndex = i;
					}
				}
				ostIndex = ostIndex == -1 ? 0 : ostIndex;
			}
			createPlayer(ostIndex);
		});
		youtubeAPIReady = true;
	});

	function onPlayerReady() {
		if (player) {
			const currentTime = player.getCurrentTime();
			const duration = player.getDuration();
			videoCurrentTime = formatTime(currentTime);
			videoDuration = formatTime(duration);
		}
	}

	/**
	 * @param {{ data: any; }} event
	 */
	function onPlayerStateChange(event) {
		switch (event.data) {
			case YT.PlayerState.UNSTARTED:
				videoCurrentTime = '0:00';
				videoDuration = formatTime(player.getDuration());
				break;
			case YT.PlayerState.PLAYING:
				// Clear any existing interval
				if (intervalId) {
					clearInterval(intervalId);
				}

				// Set new interval
				intervalId = setInterval(updateSeekBar, 1000);
				toggleVideoPlaybackText = 'Pause';
				videoDuration = formatTime(player.getDuration());
				break;
			case YT.PlayerState.PAUSED:
				toggleVideoPlaybackText = 'Play';
				break;
			case YT.PlayerState.ENDED:
				toggleVideoPlaybackText = 'Play';
				if (loopMode === LOOP_CURRENT_VIDEO) {
					player.playVideo();
				} else if (loopMode === LOOP_PLAYLIST) {
					console.log(ostIndex, playlist.length - 1);
					if (ostIndex === playlist.length - 1) {
						ostIndex = 0;
						player.loadVideoById(playlist[ostIndex].id);
					} else {
						nextVideo();
					}
				} else if (loopMode === NO_LOOP) {
					if (ostIndex === playlist.length - 1) {
						console.log('Playlist ended');	
					} else {
						nextVideo();
					}
				}
				break;
		}
	}

	function updateSeekBar() {
		if (player) {
			const currentTime = player.getCurrentTime();
			const duration = player.getDuration();

			progressCurrentTime = (currentTime / duration) * 100;
			videoCurrentTime = formatTime(currentTime);
		}
	}

	/**
	 *
	 * @param {Event} event
	 */
	function seekVideo(event) {
		if (player) {
			const seekTo = parseInt(/** @type {HTMLInputElement} */ (event.target).value) / 100;
			const duration = player.getDuration();
			player.seekTo(seekTo * duration);
		}
	}

	function toggleVideoPlayback() {
		if (player && player.getPlayerState()) {
			if (player.getPlayerState() === YT.PlayerState.PLAYING) {
				player.pauseVideo();
				toggleVideoPlaybackText = 'Play';
			} else {
				player.playVideo();
				toggleVideoPlaybackText = 'Pause';
			}
		}
	}

	function toggleLoop() {
		loopMode = (loopMode + 1) % 3;

		if (loopMode === NO_LOOP) {
			toggleLoopText = 'No Looping';
		} else if (loopMode === LOOP_CURRENT_VIDEO) {
			toggleLoopText = 'Loop current video';
		} else if (loopMode === LOOP_PLAYLIST) {
			toggleLoopText = 'Loop playlist';
		}
	}

	function changeSpeed() {
		currentSpeed = currentSpeed === 1 ? 1.5 : 1;
		player.setPlaybackRate(currentSpeed);
	}

	function prevVideo() {
		ostIndex = (ostIndex - 1 + playlist?.length) % playlist?.length;
		player.loadVideoById(playlist[ostIndex].id);
		clearInterval(intervalId);
		progressCurrentTime = 0;
		videoCurrentTime = '0:00';
		videoDuration = formatTime(player.getDuration());
		scrollToCurrentOst();
	}

	function nextVideo() {
		if (ostIndex < playlist.length  - 1) {
			clearInterval(intervalId);
			progressCurrentTime = 0;
			videoCurrentTime = '0:00';
			ostIndex = (ostIndex + 1) % playlist?.length;
			player.loadVideoById(playlist[ostIndex].id);
			videoDuration = formatTime(player.getDuration());
			scrollToCurrentOst();
		} else {
			// TODO: If user enabled loop playlist mode then reach to the first ost index.
			console.log('Reached the last video, no further progression in No Loop mode');
		}
	}

	function playOst(event) {
		event.preventDefault();
		const searchParams = new URLSearchParams(event.target.getAttribute('href'));
		const videoId = searchParams.get('v');
		ostIndex = playlist?.findIndex(video => {
			return video.id === videoId
		});
		if (intervalId) {
			clearInterval(intervalId);
		}
		videoDuration = '0:00';
		player.cueVideoById(playlist[ostIndex].id);
	}

	function scrollToCurrentOst() {
		if (!playlistContainer || !ostRefs[ostIndex]) return;

		const container = playlistContainer;
		const element = ostRefs[ostIndex];

		const containerRect = container.getBoundingClientRect();
		const elementRect = element.getBoundingClientRect();

		// Calculate the scroll position to center the element
		const scrollTop = 
			element.offsetTop - 
			container.offsetTop -
			(containerRect.height - elementRect.height) / 2;
		
		// Smooth scroll to position
		container.scrollTo({
			top: scrollTop,
			behavior: 'smooth'
		});
	}

	const highlightSearchTerm = (/** @type {string} */ text) => {
		if (!searchTerm) return text;
		const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
		return parts.map((part) => {
			return part.toLowerCase() === searchTerm.toLowerCase()
				? `<span style="background-color: rgb(254 240 138);">${part}</span>`
				: part;
		}).join('');
	}

	$effect(() => {
		if (searchMode === 'jump' && searchTerm) {
			/**
			 * @type {number | undefined}
			 */
			const firstMatch = playlist?.findIndex(ost => {
				return ost.title.toLowerCase().includes(searchTerm.toLowerCase());
			});

			if (firstMatch !== 1) {
				const container = playlistContainer;
				const element = ostRefs[firstMatch];

				const containerRect = container.getBoundingClientRect();
				const elementRect = element.getBoundingClientRect();

				// Calculate the scroll position to center the element
				const scrollTop = 
					element.offsetTop -
					container.offsetTop -
					(containerRect.height - elementRect.height) / 2;

				// Smooth scroll to position
				container.scrollTo({
					top: scrollTop,
					behavior: 'smooth'
				});
			}
		}
	});
</script>

<svelte:head>
	<title>Playlist - anime.kresna.me</title>
	<meta name="title" content="Playlist - anime.kresna.me">
    <meta name="description" content="Playlist of anime.kresna.me.">
    <meta name="og:type" content="website">
    <meta name="og:title" content="Playlist - anime.kresna.me">
    <meta name="og:description" content="Playlist of anime.kresna.me.">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Playlist - anime.kresna.me">
    <meta name="twitter:description" content="Playlist of anime.kresna.me.">
</svelte:head>

<div style="text-align: center;">
    <h1><a href="/">anime.kresna.me</a></h1>
    <Nav />
    <p>{playlist.length} Original Soundtrack (OST) from {data.total_anime} anime.</p>
    <p>Let's nostalgia together! 📻🎼🎼</p>
</div>

<div style="display: flex; flex-direction: column; align-items: center;">
	<div id="player"></div>
	<div class="controls my-4">
		<div>
			<button onclick={toggleVideoPlayback}>{toggleVideoPlaybackText}</button>
			<button onclick={toggleLoop}>{toggleLoopText}</button>
			<button onclick={changeSpeed}>Speed {currentSpeed.toString()}x</button>
		</div>
		<div>
			<input
				type="range"
				bind:value={progressCurrentTime}
				onmouseup={seekVideo}
				min="0"
				max="100"
				step="1"
			/>
			<span>{videoCurrentTime}</span>/<span>{videoDuration}</span>
		</div>
		<div>
			<button onclick={prevVideo}>Previous</button>
			<button onclick={nextVideo}>Next</button>
		</div>
	</div>
	<div style="margin-bottom: 1rem;">
		<div style="display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem;">
			<input type="text" bind:value={searchTerm} placeholder="Search ost..." style="width: 100%; padding-left: 2.5rem; padding-right: 1rem; padding-top: .5rem; padding-bottom: .5rem; border-width: 1px; border-radius: .25rem;">
			<select bind:value={searchMode} style="border-width: 1px; border-radius: .25rem; padding: .5rem .75rem;">
				<option value="jump">Jump</option>
				<option value="filter">Filter</option>
			</select>
		</div>
	</div>
	<ul bind:this={playlistContainer} style="list-style-type: none; margin: 0; padding: 0; height: 360px; overflow: hidden; overflow-y: scroll;">
		{#each (searchMode === 'filter' ? filteredPlaylist : playlist) as ost, index}
			<li class="ost-item" bind:this={ostRefs[index]} class:active={index === ostIndex}><a onclick={playOst} href="?v={ost.id}">{@html highlightSearchTerm(ost.title)}</a></li>
		{/each}
	</ul>
</div>

<style>
	#player {
		width: 100%;
		height: 320px;
	}

	@media screen and (min-width: 1280px) {
		#player {
			max-width: 640px;
		}
	}

	.ost-item {
		padding: 1rem;
		width: 100%;
	}

	.ost-item > a {
		text-decoration: none;
		color: black;
	}

	@media screen and (min-width: 1280px) {
		.ost-item {
			width: 575px;
		}
	}

	.ost-item:hover {
		background-color: #f0f0f0;
	}

	.ost-item:hover a {
		color: #747bff;
	}

	.ost-item.active {
		background-color: #e0e0e0;
		font-weight: bold;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
</style>
