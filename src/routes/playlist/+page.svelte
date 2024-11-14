<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { formatTime } from '$lib/util.js';
	import Nav from '$lib/Nav.svelte';

	export let data;

	let youtubeAPIReady = false;
	/** @type {YT.Player | undefined} */
	let player;
	let animeIndex = 0;
	let ostIndex = 0;
	let progressCurrentTime = 0;
	let videoCurrentTime = '0:00';
	let videoDuration = '0:00';
	let currentSpeed = 1;
	// 0: No looping, 1: loop current video, 2: loop entire playlist
	let loopMode = 0;
	/** @type {number | undefined } */
	let intervalId;

	let toggleVideoPlaybackText = 'Play';
	let toggleLoopText = 'No Looping';

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

	function createPlayer(animeIndex = 0, ostIndex = 0) {
		if (!youtubeAPIReady) return;

		if (!player) {
			player = new YT.Player('player', {
				height: '320',
				width: '640',
				videoId: data.anime[animeIndex].playlist[ostIndex].id,
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

	onMount(() => {
		loadYouTubeAPI().then(() => {
			if ($page.url.searchParams.get('v')) {
				let videoId = $page.url.searchParams.get('v');
				for (let i = 0; i < data.anime.length; i++) {
					const anime = data.anime[i];
					for (let j = 0; j < anime.playlist?.length; j++) {
						const ost = anime.playlist[j];
						if (ost.id === videoId) {
							ostIndex = j;
							animeIndex = i;
						}
					}
				}
				ostIndex = ostIndex == -1 ? 0 : ostIndex;
			}
			createPlayer(animeIndex, ostIndex);
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
				if (loopMode === 1) {
					// Loop the current video
					player.playVideo();
				} else if (loopMode === 2) {
					if (ostIndex === data.anime[animeIndex].playlist.length - 1) {
						// Loop back to the first video when the last video ends
						animeIndex = 0;
						ostIndex = 0;
						const playlist = data.anime[animeIndex].playlist;
						player.loadVideoById(playlist[ostIndex].id);	
					} else {
						nextVideo();
					}
				} else if (loopMode === 0) {
					if (ostIndex === data.anime[animeIndex].playlist.length - 1) {
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

		if (loopMode === 0) {
			toggleLoopText = 'No Looping';
		} else if (loopMode === 1) {
			toggleLoopText = 'Loop current video';
		} else if (loopMode === 2) {
			toggleLoopText = 'Loop playlist';
		}
	}

	function changeSpeed() {
		currentSpeed = currentSpeed === 1 ? 1.5 : 1;
		player.setPlaybackRate(currentSpeed);
	}

	function prevVideo() {
		// As long as ostIndex in certain anime more than 0 then step down
		if (ostIndex > 0) {
			ostIndex = ostIndex - 1;
		} else {
			// If not, then step down the animeIndex as long as the animeIndex > 0
			if (animeIndex > 0) {
				animeIndex = animeIndex - 1;
				// Then get the ostIndex based on playlist.length - 1;
				ostIndex = data.anime[animeIndex].playlist?.length - 1;
			} else {
				animeIndex = 0;
				ostIndex = 0;
			}
		}
		player.loadVideoById(data.anime[animeIndex].playlist[ostIndex].id);
		clearInterval(intervalId);
		progressCurrentTime = 0;
		videoCurrentTime = '0:00';
		videoDuration = formatTime(player.getDuration());
	}

	function nextVideo() {
		clearInterval(intervalId);
		progressCurrentTime = 0;
		videoCurrentTime = '0:00';
		if (loopMode !== 0 || ostIndex < data.anime[animeIndex].playlist.length - 1) {
			ostIndex = (ostIndex + 1) % data.anime[animeIndex].playlist?.length;
			player.loadVideoById(data.anime[animeIndex].playlist[ostIndex].id);
			videoDuration = formatTime(player.getDuration());
		} else {
			animeIndex = (animeIndex + 1) % data.anime.length;
			ostIndex = 0;
			player.loadVideoById(data.anime[animeIndex].playlist[ostIndex].id);
			videoDuration = formatTime(player.getDuration());
		}
	}

	function playOst(event) {
		event.preventDefault();
		const searchParams = new URLSearchParams(event.target.getAttribute('href'));
		const videoId = searchParams.get('v');
		for (let i = 0; i < data.anime.length; i++) {
			const anime = data.anime[i];
			for (let j = 0; j < anime.playlist?.length; j++) {
				const ost = anime.playlist[j];
				if (ost.id === videoId) {
					ostIndex = j;
					animeIndex = i;
				}
			}
		}
		if (intervalId) {
			clearInterval(intervalId);
		}
		videoDuration = '0:00';
		player.cueVideoById(data.anime[animeIndex].playlist[ostIndex].id);
	}
</script>

<div style="text-align: center;">
    <h1><a href="/">anime.kresna.me</a></h1>
    <Nav />
    <p>{data.total_ost} Original Soundtrack (OST) from {data.anime.length} anime.</p>
    <p>Let's nostalgia together! 📻🎼🎼</p>
</div>

<div style="display: flex; flex-direction: column; align-items: center;">
	<div id="player"></div>
	<div class="controls my-4">
		<div>
			<button on:click={toggleVideoPlayback}>{toggleVideoPlaybackText}</button>
			<button on:click={toggleLoop}>{toggleLoopText}</button>
			<button on:click={changeSpeed}>Speed {currentSpeed.toString()}x</button>
		</div>
		<div>
			<input
				type="range"
				bind:value={progressCurrentTime}
				on:mouseup={seekVideo}
				min="0"
				max="100"
				step="1"
			/>
			<span>{videoCurrentTime}</span>/<span>{videoDuration}</span>
		</div>
		<div>
			<button on:click={prevVideo}>Previous</button>
			<button on:click={nextVideo}>Next</button>
		</div>
	</div>

	<ul style="list-style-type: none; margin: 0; padding: 0; height: 360px; overflow: hidden; overflow-y: scroll;">
		{#each data.anime as anime, anime_index}
			<li>
				<span style="display: inline-block; font-size: large; margin-bottom: .5rem; font-weight: 600;">{anime.name}</span>
				<ul style="list-style: none; margin: 0; padding: 0;">
					{#each anime.playlist as ost, ost_index}
						<li class="ost-item" class:active={anime_index === animeIndex && ost_index === ostIndex}><a on:click={playOst} href="?v={ost.id}">{ost.title}</a></li>
					{/each}
				</ul>
			</li>
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
