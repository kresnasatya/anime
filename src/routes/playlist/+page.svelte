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

	/** @type {number | undefined } */
	let intervalId;

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
				videoId: data.playlist[ostIndex].id,
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
				for (let i = 0; i < data.playlist.length; i++) {
					const ost = data.playlist[i];
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
					console.log(ostIndex, data.playlist.length - 1);
					if (ostIndex === data.playlist.length - 1) {
						ostIndex = 0;
						player.loadVideoById(data.playlist[ostIndex].id);
					} else {
						nextVideo();
					}
				} else if (loopMode === NO_LOOP) {
					if (ostIndex === data.playlist.length - 1) {
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
		ostIndex = (ostIndex - 1 + data.playlist?.length) % data.playlist?.length;
		player.loadVideoById(data.playlist[ostIndex].id);
		clearInterval(intervalId);
		progressCurrentTime = 0;
		videoCurrentTime = '0:00';
		videoDuration = formatTime(player.getDuration());
	}

	function nextVideo() {
		if (ostIndex < data.playlist.length  - 1) {
			clearInterval(intervalId);
			progressCurrentTime = 0;
			videoCurrentTime = '0:00';
			ostIndex = (ostIndex + 1) % data.playlist?.length;
			player.loadVideoById(data.playlist[ostIndex].id);
			videoDuration = formatTime(player.getDuration());
		} else {
			// TODO: If user enabled loop playlist mode then reach to the first ost index.
			console.log('Reached the last video, no further progression in No Loop mode');
		}
	}

	function playOst(event) {
		event.preventDefault();
		const searchParams = new URLSearchParams(event.target.getAttribute('href'));
		const videoId = searchParams.get('v');
		ostIndex = data.playlist?.findIndex(video => {
			return video.id === videoId
		});
		if (intervalId) {
			clearInterval(intervalId);
		}
		videoDuration = '0:00';
		player.cueVideoById(data.playlist[ostIndex].id);
	}
</script>

<svelte:head>
	<title>Playlist - anime.kresna.me</title>
</svelte:head>

<div style="text-align: center;">
    <h1><a href="/">anime.kresna.me</a></h1>
    <Nav />
    <p>{data.playlist.length} Original Soundtrack (OST) from {data.total_anime} anime.</p>
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

	<ul style="list-style-type: none; margin: 0; padding: 0; height: 360px; overflow: hidden; overflow-y: scroll;">
		{#each data.playlist as ost, index}
			<li class="ost-item" class:active={index === ostIndex}><a onclick={playOst} href="?v={ost.id}">{ost.title}</a></li>
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
