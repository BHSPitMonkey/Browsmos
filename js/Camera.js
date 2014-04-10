function Camera(canvas) {
	// Constants
	this.scale_smoothness = 0.3;
	this.move_smoothness = 0.3;
	
	// Variables
	this.canvas = canvas;
	this.x = 0;
	this.y = 0;
	this.x_target = 0;
	this.y_target = 0;
	this.scale = 0.5;	
	this.scale_target = 1;
	
	// Methods
	this.world_to_viewport = function(n, dimension) {
		var canvas_side_length = (dimension == 'x') ? this.canvas.width : this.canvas.height;
		var offset = (dimension == 'x') ? this.x : this.y;
		return (n * this.scale) + (canvas_side_length / 2) - (offset * this.scale);
	};
	this.world_to_viewport_x = function(x) {
		return this.world_to_viewport(x, 'x');
	};
	this.world_to_viewport_y = function(y) {
		return this.world_to_viewport(y, 'y');
	};
	
	this.viewport_to_world = function(n, dimension) {
		var canvas_side_length = (dimension == 'x') ? this.canvas.width : this.canvas.height;
		var offset = (dimension == 'x') ? this.x : this.y;
		return (n + (offset * this.scale) - (canvas_side_length / 2)) / this.scale;
	};
	this.viewport_to_world_x = function(x) {
		return this.viewport_to_world(x, 'x');
	};
	this.viewport_to_world_y = function(y) {
		return this.viewport_to_world(y, 'y');
	};
	this.update = function(target_x, target_y, frame_delta) {
		this.x_target = target_x;
		this.y_target = target_y;
		
		// Gently move to target
		if (this.scale != this.scale_target)
			this.scale = Math.abs(this.scale + (frame_delta * (this.scale_target - this.scale) * this.scale_smoothness));
		if (this.x != this.x_target)
			this.x += frame_delta * (this.x_target - this.x) * this.move_smoothness;
		if (this.y != this.y_target)
			this.y += frame_delta * (this.y_target - this.y) * this.move_smoothness;
	};
}
