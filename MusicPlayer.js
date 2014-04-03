function MusicPlayer(songArray, sfxDict, assetDir) {
	// Constants
	this.default_volume = 0.6;
	
	// Variables
	this.songs = songArray;
	this.sounds = sfxDict;
	if (assetDir)
		this.asset_dir = assetDir;
	else
		this.asset_dir = "assets/";
	this.inited = false;
	this.song_volume = this.default_volume;
	
	// State variables
	this.current_song = 0;
	this.song_audio;
	this.muted = false;
	
	// Methods
	
	this.init = function() {
		this.load_song();
		this.inited = true;
		
		for (var i in this.sounds) {
			var src = this.sounds[i][0];
			this.sounds[i].push([new Audio(this.asset_dir + src), new Audio(this.asset_dir + src)]);
			this.sounds[i].push(0);
		}
	};
	
	// Load the current song into song_audio
	this.load_song = function() {
		if (this.songs.length > this.current_song) {
			if (this.song_audio) {
				this.song_audio.pause();
				delete this.song_audio;
			}
			this.song_audio = new Audio(this.asset_dir + this.songs[this.current_song][0]);
			this.song_audio.volume = this.default_volume;
			this.song_audio.addEventListener('ended', function() {world.music.next_song();}, false);
			
			// Display metadata
			var infobox = document.getElementById('songinfo');
			var titlebox = document.getElementById('songtitle');
			var artistbox = document.getElementById('songartist');
			if (infobox && titlebox && artistbox) {
				titlebox.innerText = this.songs[this.current_song][1];
				artistbox.innerText = this.songs[this.current_song][2];
				infobox.className = "featured";
				setTimeout("document.getElementById('songinfo').className='idle';", 2000);
			}
		}
	};
	
	// Load and play the next song in the list
	this.next_song = function() {
		this.current_song = (this.current_song + 1) % this.songs.length;
		this.load_song();
		this.play_song();
	};
	
	this.play_song = function() {
		if (this.song_audio && !this.muted) {
			this.song_audio.play();
		}
	};
	
	this.pause_song = function() {
		if (this.song_audio && !this.muted) {
			this.song_audio.pause();
		}
	};
	
	// Play or pause the currently selected song
	this.play_pause_song = function() {
		if (this.song_audio) {
			
		}
	};
	
	this.lower_volume = function() {
		this.song_volume = 0.2;
	};
	
	this.raise_volume = function() {
		this.song_volume = 0.6;
	};
	
	this.mute = function() {
		if (!this.muted) {
			// Mute
			this.song_audio.pause();
			this.muted = true;
			document.getElementById("mute").className = "muted";
			document.getElementById("mute").children[0].innerText = "Unmute sounds [M]";
		}
		else {
			// Unmute
			this.song_audio.play();
			this.muted = false;
			document.getElementById("mute").className = "";
			document.getElementById("mute").children[0].innerText = "Mute sounds [M]";
		}
	};
	
	// Play the sound effect with the given name
	this.play_sound = function(name) {
		if (!this.muted) {
			var sound = this.sounds[name];
			if (sound) {
				sound[1][sound[2]].play();						// Play current round-robin Audio object for this sound
				sound[2] = (sound[2] + 1) % sound[1].length;	// Increment round-robin counter
			}
		}
	};
	
	this.update = function() {
		if (this.song_audio.volume != this.song_volume)
			this.song_audio.volume += (this.song_volume - this.song_audio.volume) * 0.1;
	};
}
