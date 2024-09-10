<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import anime from '$lib/anime.json';
	import AnimeCard from '$lib/AnimeCard.svelte';
	import { afterNavigate } from '$app/navigation';
	import { formatTime } from '$lib/util.js';

	export let data;

	$: currentSlug = $page.params.slug;
	$: currentIndex = anime.findIndex((item) => item.slug === currentSlug);
	$: prevAnime = currentIndex > 0 ? anime[currentIndex - 1] : null;
	$: nextAnime = currentIndex < anime.length - 1 ? anime[currentIndex + 1] : null;

	let youtubeAPIReady = false;
	/** @type {YT.Player | undefined} */
	let player;
	$: playlist = data.anime.playlist;
	/** @type {number | undefined} */
	let playlistIndex = 0;
	let progressCurrentTime = 0;
	let videoCurrentTime = '0:00';
	let videoDuration = '0:00';
	let currentSpeed = 1;
	// 0: No looping, 1: loop current video, 2: loop entire playlist
	let loopMode = 0;
	/** @type {number | undefined } */
	let intervalId;
	
	let playPauseText = 'Play';
	let loopButtonText = 'No Looping';

	function loadYouTubeAPI() {
		return new Promise((resolve) => {
			if (window.YT && window.YT.Player) {
				youtubeAPIReady = true;
				resolve();
				return;
			}

			const tag = document.createElement('script');
			tag.src = "https://www.youtube.com/iframe_api";

			// Safely insert the script tag
			const insertScript = () => {
				const target = document.body;
				target.parentNode?.insertBefore(tag, target);
			}

			// If the document is still loading, wait for it to be ready
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', insertScript);
			} else {
				insertScript();
			}

			window.onYouTubeIframeAPIReady = () => {
				youtubeAPIReady = true;
				resolve();
			}
		})
	}

	function createPlayer() {
		if (!youtubeAPIReady || !playlist || playlist?.length === 0) return;

		if (!player) {
			player = new YT.Player('player', {
				height: '320',
				width: '640',
				videoId: playlist[playlistIndex].id,
				playerVars: {
					controls: 0, // Hide the default YouTube player controls.
				},
				events: {
					'onReady': onPlayerReady,
					'onStateChange': onPlayerStateChange,
				}
			});
		}
	}

	onMount(() => {
		if (playlist?.length > 0) {
			loadYouTubeAPI().then(() => {
				createPlayer();
			});	
		}
	});

	afterNavigate(({ from, to }) => {
		if (from?.url.pathname === to?.url.pathname) {
			const searchParams = to?.url.searchParams;
			const videoId = searchParams?.get('v');

			if (videoId) {
				playlistIndex = playlist?.findIndex(video => {
					return video.id === videoId
				});
				if (intervalId) {
					clearInterval(intervalId);
				}
				videoDuration = '0:00';
				player.cueVideoById(playlist[playlistIndex].id);
				window.scrollTo(0, document.documentElement.scrollHeight);
			}
		} else {
			if (playlist?.length > 0) {
				if (player) {
					videoDuration = '0:00';
					player.cueVideoById(playlist[0].id);
				}
				
				if (!youtubeAPIReady) {
					loadYouTubeAPI().then(() => {
						createPlayer();
					});
				}
			}
		}
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
		if (event.data === YT.PlayerState.UNSTARTED) {
			videoCurrentTime = '0:00';
			videoDuration = formatTime(player.getDuration());
		}

		if (event.data === YT.PlayerState.PLAYING) {
			// Clear any existing interval
			if (intervalId) {
				clearInterval(intervalId);
			}

			// Set new interval
			intervalId = setInterval(updateSeekBar, 1000);
			playPauseText = 'Pause';
			videoDuration = formatTime(player.getDuration());
		} else {
			playPauseText = 'Play';
		}

		if (event.data === YT.PlayerState.ENDED) {
			if (loopMode === 1) {
            	// Loop the current video
				player.playVideo();
			}
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
			const seekTo = parseInt((/** @type {HTMLInputElement} */ (event.target)).value) / 100;
			const duration = player.getDuration();
			player.seekTo(seekTo * duration);
		}
	}

	function playPauseVideo() {
		if (player && player.getPlayerState()) {
			if (player.getPlayerState() === YT.PlayerState.PLAYING) {
				player.pauseVideo();
				playPauseText = 'Play';
			} else {
				player.playVideo();
				playPauseText = 'Pause';
			}
		}
	}

	function toggleLoop() {
		loopMode = (loopMode + 1) % 3;

		if (loopMode === 0) {
			loopButtonText = 'No Looping';	
		} else if (loopMode === 1) {
			loopButtonText = 'Loop current video';
		} else if (loopMode === 2) {
			loopButtonText = 'Loop playlist';
		}
	}

	function changeSpeed() {
		currentSpeed = (currentSpeed === 1) ? 1.5 : 1;
		player.setPlaybackRate(currentSpeed);
	}

	function prevVideo() {
		playlistIndex = (playlistIndex - 1 + playlist?.length) % playlist?.length;
		player.loadVideoById(playlist[playlistIndex].id);
		clearInterval(intervalId);
		progressCurrentTime = 0;
		videoCurrentTime = '0:00';
		videoDuration = formatTime(player.getDuration());
	}

	function nextVideo() {
		if (loopMode !== 0 || playlistIndex < playlist.length  - 1) {
			clearInterval(intervalId);
			progressCurrentTime = 0;
			videoCurrentTime = '0:00';
			playlistIndex = (playlistIndex + 1) % playlist?.length;
			player.loadVideoById(playlist[playlistIndex].id);
			videoDuration = formatTime(player.getDuration());
		} else {
			console.log('Reached the last video, no further progression in No Loop mode');
		}
	}
</script>

<svelte:head>
	<title>anime.kresna.me - {data.anime.name}</title>
</svelte:head>

<a href="/">Back</a>

<div style="display: flex; justify-content: space-around">
	{#if prevAnime}
		<a style="align-self: center; max-width: 120px;" href="/anime/{prevAnime.slug}"
			>&#8249; {prevAnime.name}</a
		>
	{:else}
		<div style="align-self: center; max-width: 120px;">&nbsp;</div>
	{/if}
	<AnimeCard anime={data.anime} />
	{#if nextAnime}
		<a style="align-self: center; max-width: 120px;" href="/anime/{nextAnime.slug}"
			>{nextAnime.name} &#8250;</a
		>
	{:else}
		<div style="align-self: center; max-width: 120px;">&nbsp;</div>
	{/if}
</div>

{#if playlist}
	<div style="display: flex; flex-direction: column; align-items: center;">
		<h2 style="margin-left: -320px;">Playlist</h2>
		<div id="player"></div>
		<div class="controls" style="display: flex; justify-content: space-between;">
		<div>
			<button id="playPause" on:click={playPauseVideo}>{playPauseText}</button>
			<button id="loop" on:click={toggleLoop}>{loopButtonText}</button>
			<button id="speed" on:click={changeSpeed}>Speed {currentSpeed.toString()}x</button>
			<input type="range" bind:value={progressCurrentTime} on:mouseup={seekVideo} min="0" max="100" step="1" />
			<span class="current-time">{videoCurrentTime}</span>/<span class="total-duration">{videoDuration}</span>
		</div>
		<div>
			<button id="prev" on:click={prevVideo}>Previous</button>
			<button id="next" on:click={nextVideo}>Next</button>
		</div>
		</div>
		<div id="playlist" style="display: flex; flex-direction: column; gap: .5rem;" data-sveltekit-preload-data="false">
			{#each playlist as ost}
				<!-- svelte-ignore a11y-invalid-attribute -->
				<a style="text-decoration: none;" href="?v={ost.id}">{ost.title}</a>
			{/each}
		</div>
	</div>
{/if}

<style>
	
</style>
