function Cell(xpos, ypos, radius) {
	// Inherit from Mover
	this.inheritFrom = Mover;
	this.inheritFrom();
	
	if (xpos)
		this.x_pos = xpos;
	if (ypos)
		this.y_pos = ypos;
	if (radius)
		this.radius = radius;

	// Scoring
	this.score = 0;

	// Store passed x pos
	this.default_x = xpos - (this.width/2.0);

	// Player color
	this.fillStyle = "#00FF00";
	
	// Methods
	this.reset = reset_player;
	this.draw = draw_player;
	this.push_up = function (mag) { if (!mag) mag=1; this.y_veloc -= mag; };
	this.push_down = function (mag) { if (!mag) mag=1; this.y_veloc += mag; };
	this.push_left = function (mag) { if (!mag) mag=1; this.x_veloc -= mag; };
	this.push_right = function (mag) { if (!mag) mag=1; this.x_veloc += mag; };
	this.verticalBounce = function () { this.y_veloc = -this.y_veloc * 0.4; };
}

function reset_cell()
{
	this.x_pos = this.default_x;
	this.y_pos = 200;
	this.last_y = 200;
	this.x_veloc = 0;
	this.y_veloc = 0;
}

function draw_cell(ctx)
{
	ctx.fillStyle = this.fillStyle;
	ctx.beginPath();
	ctx.rect(this.x_pos, this.y_pos, this.width, this.height);
	ctx.closePath();
	ctx.fill(); 

	this.last_y = this.y_pos;
}
