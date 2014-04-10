function World(canvas) {
	// Constants
	this.transfer_rate_k = 0.25;
	
	// Variables and setup
	this.cells = [];		// Array of 
	this.canvas = canvas;
	this.ctx = this.canvas.getContext('2d');
	this.cam = new Camera(canvas);
	this._lastTick = (new Date()).getTime();	// for timer
	this.frameSpacing;							// for timer
	this.frame_delta;							// for timer
	this.surr_color = "#1D40B5";	// Surrounding color of canvas outside of the level
	this.bg_color = "#2450E4";		// Background color of the level (inside the boundaries)
	this.level_width = 800;		// Just a default; Will be set in load_level
	this.level_height = 800;	// Just a default; Will be set in load_level
	this.level_total_mass;		// Will store the total mass of all cells at a given time
	this.won = false;			// Indicates if the player has won (and is now just basking in his own glory)
	this.user_did_zoom = false;	// Indicates if the player manually zoomed (so we can turn off smart zooming)
	this.paused = false;
	this.has_started = false;	// Indicates if the intro menu has been dismissed at least once
	this.debug = false;
	this.shadows = true;
	this.music = new MusicPlayer(
		[	// Music tracks (filename, song name, artist)
			['music/Pitx_-_Black_Rainbow.ogg', 'Black Rainbow', 'Pitx'], 
			['music/rewob_-_Circles.ogg', 'Circles', 'rewob'],
		], 
		{	// Sound effects (identifier, filename)
			'blip': ['fx/blip.ogg'],
			'win': ['fx/win.ogg'],
			'death': ['fx/death.ogg'],
			'bounce': ['fx/bounce.ogg'],
		}
	);

	// Methods
	this.init = function() {
		// Event registration
		this.canvas.addEventListener('mousedown', this.mouse_down, false);
		this.canvas.addEventListener('touchstart', this.touch_start, false);
		if(window.addEventListener) {
			document.addEventListener('DOMMouseScroll', this.mouse_scroll, false);
			document.addEventListener('mousewheel', this.mouse_scroll, false);
			window.addEventListener("keydown", this.key_down, false);
			window.addEventListener("blur", function() {world.pause(true);}, false);
			
			document.getElementById("mute").addEventListener('click', function() {world.music.mute();}, false);
			document.getElementById("newlevel").addEventListener('click', function() {world.load_level();}, false);
			document.getElementById("pause").addEventListener('click', function() {world.pause();}, false);
			document.getElementById("help").addEventListener('click', function() {world.toggle_help();}, false);
			document.getElementById("pausedmessage").addEventListener('click', function() {world.pause();}, false);
			document.getElementById("deathmessage").addEventListener('click', function() {world.load_level();}, false);
			document.getElementById("warningmessage").addEventListener('click', function() {world.load_level();}, false);
			document.getElementById("successmessage").addEventListener('click', function() {world.load_level();}, false);
			
			document.getElementById("playbutton").addEventListener('click', function() {world.toggle_help();}, false);
		}
		
		this.music.init();
	};
	this.toggle_help = function() {
		var overlay = document.getElementById("helpoverlay");
		
		// If overlay is hidden
		if (overlay.style.display == "none") {
			this.pause(true);					// Pause the game
			overlay.style.display = "block";	// Show overlay
		}
		else {
			overlay.style.display = "none";		// Hide overlay
		}
		
		// If we're just now starting the game
		if (!this.has_started) {
			this.load_level();
			this.music.play_song();
			this.has_started = true;
		}
	};
	this.pause = function(forcepause) {
		if (this.paused && !forcepause) {
			// Unpause
			this.clear_msgs();
			this.paused = false;
			this.music.raise_volume();
		}
		else {
			// Pause
			this.show_message("pausedmessage");
			this.paused = true;
			this.music.lower_volume();
		}
	};
	this.zoom_to_player = function() {
		// Scale 1x looks best when player radius is 40
		this.cam.scale_target = 40 / this.get_player().radius;
	};
	this.load_level = function() {
		this.cells = [];
		this.user_did_zoom = false;
		this.won = false;
		this.clear_msgs();
		
		// Define level boundary
		this.level_radius = 500;
		
		// Define the player first
		this.cells.push(new Cell(0, 0, 10));
		
		// Generate a bunch of random cells
		var num_cells = 30;
		var rad, ang, r, x, y, cell;
		for (var i=0; i<num_cells; i++) {
			if (i < 4)
				rad = 5 + (Math.random()*5);	// Small cells
			else if (i < 6)
				rad = 40 + (Math.random()*15);	// Big cells
			else
				rad = 7 + (Math.random()*35);	// Everything else
			ang = Math.random() * 2 * Math.PI;
			r = Math.random() * (this.level_radius - 20 - rad - rad);
			x = (30 + rad + r) * Math.sin(ang);
			y = (30 + rad + r) * Math.cos(ang);
			cell = new Cell(x, y, rad);
			cell.x_veloc = (Math.random() - 0.5) * 0.35;
			cell.y_veloc = (Math.random() - 0.5) * 0.35;
			this.cells.push(cell);
		}
		delete cell;

		// Center camera over level
		if (this.cam.x == 0 && this.cam.y == 0) {
			this.cam.x = this.level_width / 2;
			this.cam.y = this.level_width / 2;
		}
		this.cam.x_target = this.cam.x;
		this.cam.y_target = this.cam.y;
		this.zoom_to_player();
		
		// Count total cell mass for loaded level
		this.level_total_mass = 0;
		for (var i=0; i<this.cells.length; i++)
			this.level_total_mass += this.cells[i].area();
	};
	this.get_player = function() {
		if (this.cells.length > 0)
			return this.cells[0];
	};
	this.push_player_from = function(x, y) {
		var player = this.get_player();
		if (player && !player.dead) {
			var dx = player.x_pos - x;
			var dy = player.y_pos - y;

			// Normalize dx/dy
			var mag = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
			dx /= mag;
			dy /= mag;
			
			// Reduce force in proportion to area
			var area = player.area();
			var fx = dx * (5/9);// (400 / (area + 64));
			var fy = dy * (5/9);//(400 / (area + 64));
			
			// Push player
			player.x_veloc += fx;
			player.y_veloc += fy;
			
			// Lose some mass (shall we say, 1/25?)
			var expense = (area/25) / (2*Math.PI*player.radius);
			player.radius -= expense;
			
			// Shoot off the expended mass in opposite direction
			var newrad = Math.sqrt((area/20)/Math.PI);
			var newx = player.x_pos - (dx * (player.radius + newrad + 1)); // The +1 is for cushioning!
			var newy = player.y_pos - (dy * (player.radius + newrad + 1));
			var newcell = new Cell(newx, newy, newrad);
			newcell.x_veloc = -fx * 9;
			newcell.y_veloc = -fy * 9;
			this.cells.push(newcell);

			// Blip!
			this.music.play_sound("blip");
		}
	};
	this.click_at_point = function(x, y) {
		if (!world.paused) {
			// Convert view coordinates (clicked) to world coordinates
			x = this.cam.viewport_to_world_x(x);
			y = this.cam.viewport_to_world_y(y);
		
			// Push player
			this.push_player_from(x, y);
		}
	};
	this.touch_start = function(ev) {
		ev.preventDefault();		// Prevent dragging
		var touch = ev.touches[0];	// Just pay attention to first touch
		
		world.click_at_point(touch.pageX, touch.pageY);
	};
	this.mouse_down = function(ev) {
		ev.preventDefault();
		if (ev.layerX || ev.layerX == 0) { // Firefox
			ev._x = ev.layerX;
			ev._y = ev.layerY;
		} else if (ev.offsetX || ev.offsetX == 0) { // Opera
			ev._x = ev.offsetX;
			ev._y = ev.offsetY;
		}

		world.click_at_point(ev._x, ev._y);
	};
	this.mouse_scroll = function(event) {
		var delta = 0;
 
		if (!event) event = window.event;

		// normalize the delta
		if (event.wheelDelta) {
			// IE and Opera
			delta = event.wheelDelta / 60;
		} else if (event.detail) {
			// W3C
			delta = -event.detail / 2;
		}
		delta = delta / Math.abs(delta);
		
		if (delta != 0) {
			world.user_did_zoom = true;
			if (delta > 0)
				world.cam.scale_target *= 1.2;
			if (delta < 0)
				world.cam.scale_target /= 1.2;
		}
	};
	this.key_down = function(e) {
		var code;
		if (!e)	var e = window.event;
		if (e.keyCode) code = e.keyCode;
		else if (e.which) code = e.which;
		
		if (world.debug)
			console.log("Pressed key with code " + code);
		
		switch (code){ 
			case 80:	// P
				world.pause();
				break;
			case 82:	// R
				world.load_level();
				break;
			case 68:	// D
				world.debug = !world.debug;
				break;
			case 72:	// H
				world.toggle_help();
				break;
			case 83:	// S
				world.shadows = !world.shadows;
				break;
			case 77:	// M
				world.music.mute();
				break;
			case 78:	// N
				world.music.next_song();
				break;
		}
	};
	this.transfer_mass = function(cell1, cell2) {
		var player = this.get_player();
		
		// Determine bigger cell
		var bigger = cell1;
		var smaller = cell2;
		if (cell2.radius > cell1.radius) {
			bigger = cell2;
			smaller = cell1;
		}
		
		// Overlap amount will affect transfer amount
		var overlap = (cell1.radius + cell2.radius - cell1.distance_from(cell2)) / (2 * smaller.radius);
		if (overlap > 1) overlap = 1;
		overlap *= overlap;
		var mass_exchange = overlap * smaller.area() * this.frame_delta;
		
		smaller.radius -= mass_exchange / (2*Math.PI*smaller.radius);
		bigger.radius += mass_exchange / (2*Math.PI*bigger.radius);
		
		// If the player is the one gaining mass here, zoom the camera
		if (bigger === player && !this.user_did_zoom) {
			this.zoom_to_player();
		}
		
		
		// Check if we just killed one of the cells
		if (smaller.radius <=1) {
			smaller.dead = true;
			
			// If we just killed the player, callback.
			if (smaller === player)
				this.player_did_die();
		}
	};
	this.clear_msgs = function(forceclear) {
		var msgs = document.getElementsByClassName("messages");
		for (var i=0; i<msgs.length; i++)
			msgs[i].style.display = "none";
		
		// Re-show important messages that are still relevant
		if (!forceclear) {
			if (this.won)
				this.show_message("successmessage");
			else if (this.get_player() && this.get_player().dead)
				this.show_message("deathmessage");
		}
	};
	this.show_message = function(id) {
		this.clear_msgs(true);
		var div = document.getElementById(id);
		if (div) {
			div.style.display = "block";
		}
	};
	this.player_did_die = function() {
		this.music.play_sound("death");
		this.show_message("deathmessage");
		
		// Cute animation thing
		var player = this.get_player();
		player.x_pos = player.y_pos = 0;
		if (this.cam.scale_target > 0.538)
			this.cam.scale_target = 0.538;
		for (var i=1; i<this.cells.length; i++) {
			var cell = this.cells[i];
			if (!cell.dead) {
				cell.x_veloc += (cell.x_pos - player.x_pos) / 50;
				cell.y_veloc += (cell.y_pos - player.y_pos) / 50;
			}
		}
	};
	this.player_did_win = function() {
		if (!this.won) {
			this.won = true;
			this.music.play_sound("win");
			this.show_message("successmessage");
		}
	};
	this.update = function() {
		var player = this.get_player();
		
		// Advance timer
		var currentTick = (new Date()).getTime();
		this.frameSpacing = currentTick - this._lastTick;
		this.frame_delta = this.frameSpacing / mspf;
		this._lastTick = currentTick;

		// Canvas maintenance
		this.canvas.height = window.innerHeight;
		this.canvas.width = window.innerWidth;
		center = [this.canvas.width/2, this.canvas.height/2];
		viewport_radius = Math.min(this.canvas.height, this.canvas.width) / 2;
		
		// Background
		this.ctx.fillStyle = this.surr_color;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.beginPath();
		this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.closePath();
		this.ctx.fill();
		
		// Level boundary
		this.ctx.fillStyle = this.bg_color;
		this.ctx.beginPath();
		this.ctx.arc(this.cam.world_to_viewport_x(0), this.cam.world_to_viewport_y(0), 
						Math.abs(this.level_radius*this.cam.scale), 0, Math.PI*2, true);
		this.ctx.closePath();
		this.ctx.fill();
		if (this.shadows) {
			this.ctx.strokeStyle = "rgba(0,0,0,0.3)";
			this.ctx.lineWidth = 2;
			this.ctx.beginPath();
			this.ctx.arc(this.cam.world_to_viewport_x(0)+2, this.cam.world_to_viewport_y(0)+4, 
							this.level_radius*this.cam.scale, 0, Math.PI*2, true);
			this.ctx.closePath();
			this.ctx.stroke();
		}		
		this.ctx.strokeStyle = "#ffffff";
		this.ctx.lineWidth = 2;
		this.ctx.beginPath();
		this.ctx.arc(this.cam.world_to_viewport_x(0), this.cam.world_to_viewport_y(0), 
						this.level_radius*this.cam.scale, 0, Math.PI*2, true);
		this.ctx.closePath();
		this.ctx.stroke();
		
		// Run collisions and draw everything
		var smallest_big_mass = 9999999999, total_usable_mass = 0, curr_area;
		for (var i=0; i<this.cells.length; i++) {
			if (!this.cells[i].dead) {
				if (!this.paused) {
					for (var j=0; j<this.cells.length; j++) {
						if ((i != j) && (!this.cells[j].dead)) {
							if (this.cells[i].collides_with(this.cells[j])) {
								this.transfer_mass(this.cells[i], this.cells[j]);
							}
						}
					}
					this.cells[i].update(this.frame_delta);
				
					// Get some stats about orb sizes
					curr_area = this.cells[i].area();
					if (this.cells[i].radius > this.get_player().radius) {
						if (curr_area < smallest_big_mass)
							smallest_big_mass = curr_area;
					}
					else 
						total_usable_mass += curr_area;
				
					// If cell is outside of level bounds, fix it
					var cell_x = this.cells[i].x_pos,
						cell_y = this.cells[i].y_pos,
						cellrad = this.cells[i].radius,
						dist_from_origin = Math.sqrt(Math.pow(cell_x, 2) + Math.pow(cell_y, 2));
					if (dist_from_origin + cellrad > this.level_radius) {
						// Do some homework
						var cell_xvel = this.cells[i].x_veloc,
							cell_yvel = this.cells[i].y_veloc;
						
						// Move cell safely inside bounds
						this.cells[i].x_pos *= ((this.level_radius-cellrad-1) / dist_from_origin);
						this.cells[i].y_pos *= ((this.level_radius-cellrad-1) / dist_from_origin);
						cell_x = this.cells[i].x_pos;
						cell_y = this.cells[i].y_pos;
						dist_from_origin = Math.sqrt(Math.pow(cell_x, 2) + Math.pow(cell_y, 2));
					
						// Bounce!

						// Find speed
						var cell_speed = Math.sqrt( Math.pow(cell_xvel, 2) + Math.pow(cell_yvel, 2) );
						// Find angles of "center to cell" and cell's velocity
						var angle_from_origin = angleForVector(cell_x, cell_y);
						var veloc_ang = angleForVector(cell_xvel, cell_yvel);
						// Get new velocity angle
						var new_veloc_ang = Math.PI + angle_from_origin + (angle_from_origin - veloc_ang);
						// Normalize the vector from the origin to the cell's new position
						var center_to_cell_norm_x = -cell_x * (1 / dist_from_origin);
						var center_to_cell_norm_y = -cell_y * (1 / dist_from_origin);
						// Set new velocity components
						this.cells[i].x_veloc = cell_speed * Math.cos(new_veloc_ang);
						this.cells[i].y_veloc = cell_speed * Math.sin(new_veloc_ang);
						
						// If this cell is the player, make a bounce noise
						if (i == 0)
							this.music.play_sound("bounce");
					}
				}
				
				// If not the player, draw it now
				if (i != 0) {
					this.cells[i].draw(this.ctx, this.cam, this.shadows, this.get_player().radius);
				}
			}
		}
		
		// React to statistical events
		if (!player.dead && !this.paused && !this.won) {
			if (smallest_big_mass == 9999999999) {
				// Player won
				this.player_did_win();
			}
			else if (total_usable_mass < smallest_big_mass) {
				// Display the "not looking good..." message
				this.show_message("warningmessage");
			}
		}
		
		// Draw player
		player.draw(this.ctx, this.cam, this.shadows);
		
		// Camera-track player
		this.cam.update(player.x_pos, player.y_pos, this.frame_delta);
		
		// Update music player
		this.music.update();
	};
	
	// Call init
	this.init();
}
function rad2deg (rad) {
	return (rad/(2*Math.PI)) * 360;
}
function angleForVector(x, y) {
	var ang = Math.atan(y/x);
	if (x < 0) ang += Math.PI;
	else if (y < 0) ang += 2 * Math.PI;
	return ang;
}
