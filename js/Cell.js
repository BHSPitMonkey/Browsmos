function Cell(xpos, ypos, radius) {
	// Inherit from Mover
	this.inheritFrom = Mover;
	this.inheritFrom();
	
	// Store passed
	if (xpos)
		this.x_pos = xpos;
	if (ypos)
		this.y_pos = ypos;
	if (radius)
		this.radius = radius;
	
	this.default_x = this.x_pos;
	this.default_y = this.y_pos;

	// Properties
	this.dead = false;

	// Player color
	this.fillStyle = "#73DBFF";
	
	// Methods
	this.reset = reset_cell;
	this.update = update_cell;
	this.draw = draw_cell;
	this.push_up = function (mag) { if (!mag) mag=1; this.y_veloc -= mag; };
	this.push_down = function (mag) { if (!mag) mag=1; this.y_veloc += mag; };
	this.push_left = function (mag) { if (!mag) mag=1; this.x_veloc -= mag; };
	this.push_right = function (mag) { if (!mag) mag=1; this.x_veloc += mag; };
	this.area = function() {
		return Math.PI * this.radius * this.radius;
	}
}

function reset_cell() {
	this.x_pos = this.default_x;
	this.y_pos = this.default_y;
	this.x_veloc = 0;
	this.y_veloc = 0;
	this.dead = false;
}

function update_cell(frame_delta) {
	if (!this.dead)
		this.update_mover(frame_delta);
}

function draw_cell(ctx, cam, shadow, player_radius) {
	if (!this.dead) {
		// Shadow
		if (shadow) {
			ctx.fillStyle = "rgba(0,0,0,0.3)";	// gray
			ctx.beginPath();
			ctx.arc(cam.world_to_viewport_x(this.x_pos)+1, cam.world_to_viewport_y(this.y_pos)+3, this.radius*cam.scale, 0, Math.PI*2, true);
			ctx.closePath();
			ctx.fill();
		}
		
		if (player_radius) {
			if (this.radius > player_radius)
				ctx.fillStyle = "#FF441A";	// red
			else if (player_radius - this.radius < 3)
				ctx.fillStyle = "#FFAF00";	// white
			else
				ctx.fillStyle = "#36B6FF"; // blue
		}
		else
			ctx.fillStyle = this.fillStyle;

		ctx.beginPath();
		ctx.arc(cam.world_to_viewport_x(this.x_pos), cam.world_to_viewport_y(this.y_pos), this.radius*cam.scale, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();
	}
}
