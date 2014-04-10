// Super-"class" of Ball and Player
// Handles physical attributes and actions
function Mover() {
	// Variables to hold size
	this.radius = 20;

	// Variables to hold current position
	this.x_pos = 0;
	this.y_pos = 0;
 
	// Variables to hold current velocity
	this.x_veloc = 0;
	this.y_veloc = 0;
	
	// Speed limits
	this.x_veloc_max = 100;
	this.y_veloc_max = 100;
 
	// Variables to hold x position bounds
	this.x_min = 0;
	this.x_max = 640;
	
	this.friction = 0.997;

	// Methods
	this.horizontalBounce = function() { this.x_veloc = -this.x_veloc; };
	this.verticalBounce = function() { this.y_veloc = -this.y_veloc; };
	this.distance_from = function(other) {
		var dx = this.x_pos - other.x_pos;
		var dy = this.y_pos - other.y_pos;
		return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
	}
	this.collides_with = function(other) {
		return this.distance_from(other) < this.radius + other.radius;
	};
	this.set_position = function(x, y) { this.x_pos = x; this.y_pos = y; };
	this.reset_mover = function() { };
	this.update_mover = function(frame_delta)	{
		// Enforce speed limits
		var xvelsign = this.x_veloc / Math.abs(this.x_veloc);
		if (Math.abs(this.x_veloc) > this.x_veloc_max)
			this.x_veloc = xvelsign * this.x_veloc_max;
		var yvelsign = this.y_veloc / Math.abs(this.y_veloc);
		if (Math.abs(this.y_veloc) > this.y_veloc_max)
			this.y_veloc = yvelsign * this.y_veloc_max;
	 
		// Adjust the position, according to velocity.
		this.x_pos += this.x_veloc * frame_delta;
		this.y_pos += this.y_veloc * frame_delta;
		
		// Friction
		this.x_veloc *= this.friction;
		this.y_veloc *= this.friction;
	};
	this.draw_mover = function(ctx) {
		ctx.beginPath();
		ctx.rect(this.x_pos, this.y_pos, this.width, this.height);
		ctx.closePath();
		ctx.fill();
	};

	this.reset = this.reset_mover;		// Override me
	this.update = this.update_mover;	// Override me
	this.draw = this.draw_mover;		// Override me
}
