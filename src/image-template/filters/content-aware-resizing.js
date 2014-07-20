gimel.module('imageTemplate').extend(function(moduleContent) {
	gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
		/*var energyFunction;
		var energyMap;*/

		GimelImage.prototype.retarget = function(width, height, protectMask, removeMask) {/*
			var directions {
				X: 'X', 
				Y: 'Y'
			};

			var retargeted = this.clone();

			var diffs = {
				X: width  - this.width,
				Y: height - this.height
			};

			if (xDiff > 0 && yDiff > 0) {
				removeSeam((xDiff > yDiff)
			}

			while (xDiff < 0 && yDiff < 0) {
				var seams {
					X: findSeam(directions.X),
					Y: findSeam(directions.Y)
				};

				// If xDiff != 0 and yDiff != 0, we choose the direction where the seam has the minimum energy 
				var direction = (seams.Y.energy < seams.X.energy)? directions.Y : directions.X;
				
				retargeted = removeSeam(retargeted, seams[direction]);
				diffs[direction]++;
			};*/
			/*
		  var: resized = clone(image)
		  
		  if (diff < 0):
		    while (diff > 0): 
		      var: seam = findSeam(resized)
		      var: resized = removeSeam(resized, seam)
		  
		  else:
		    if (diff > image.width/2):
		      image = resizeImage(image, image.width/2)
		      diff = diff - image.width/2
		    
		    var: seams = new Array(diff)
		    for (var: i in 0..diff-1):
		      var: seam = findSeam(resized)
		      var: resized = removeSeam(resized, seam)
		      seams[i] = seam
		   
		    var: resized = clone(image)
		    for (var: seam in seams):
		      var: resized = duplicateSeam(resized, seam)
		   
		  return: resized
			*/
		};

		GimelImage.prototype.findSeam = function() {/*
			// Energy map: first line
			for (var x = 0; x < this.width; x++) {
				energyMap.data[x] = energyFunction(this, x, 0);
			}*/

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
