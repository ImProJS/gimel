gimel.module('imageTemplate').extend(function(moduleContent) {
	gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
		var energyMap = this.cloneStructure();

		GimelImage.prototype.findSeam = function(energyFunction) {
			// Build energy map
			energyMap.data = [];
			// Energy map: first line
			for (var x = 0; x < this.width; x++) {
				energyMap.data[x] = energyFunction(this, x, 0);
			}

			/*
			var: mask = new Image(image.width, image.height)

		  var: y = 0
		  for (var: x in 0..image.width-1):
		    mask(x, y) = energy(image, x, y)

		  for (var: y in 1..image.height-1):
		    for (var: x in 0..image.width-1):
		      mask(x, y) = energy(image, x, y) 
		                 + min(mask(x-1, y-1), mask(x, y-1), mask(x+1, y-1))
		  
		  var: seam = new Array(image.height)
		  var: y = image.height-1
		  seam[y] = 0
		  for (var: x in 1..image.width-1):
		    if (mask(x, y) < mask(energy(seam[y], y):
		      seam[y] = x
		  
		  for (var: y in image.height-2..0):
		    x = seam[y+1]
		    seam[y] = x
		    if (mask(x-1, y) < mask(seam[y], y): 
		      seam[y] = x-1
		    if (mask(x+1, y) < mask(seam[y], y): 
		      seam[y] = x+1
		  
		  return: seam
		  */
		};
	});

	return false;
});
