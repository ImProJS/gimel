gimel.module('imageTemplate').extend(function(moduleContent) {
	gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {

		/*
		var energyFunction;
		var energyMap;
		*/


    if (channels === 1) {
			GimelImage.prototype.buildGradientEnergyMap = function(protectMask, removeMask) {
				if (protectMask || removeMask) console.log(' ');

				var energyMap = new gimel.Float32T1ChImage(this.width, this.height);
				var energyData = energyMap.data, imageData = this.data;

				var x, y, xx = this.width, yy = this.height, yOffset;
				// FIRST ROW
				// First pixel (top left corner)
				energyData[0] = (2*Math.abs(imageData[0] - imageData[1])  + 
					               2*Math.abs(imageData[0] - imageData[xx]));
				// Middle pixels (top border)
			  for (x = 1; x < xx - 1; ++x) {
			    energyData[x] = (  Math.abs(imageData[x - 1] - imageData[x + 1]) + 
			    	               2*Math.abs(imageData[x]     - imageData[x + xx]));
			  }
			  // Last pixel (top right corner)
			  x = xx - 1;
			  energyData[x] = (2*Math.abs(imageData[x - 1] - imageData[x]) + 
			  	               2*Math.abs(imageData[x]     - imageData[x + xx]));

			  // MIDDLE ROWS
			  // First pixel (left border)
			  for (y = 1, yOffset = xx; y < yy - 1; ++y, yOffset += xx) {
					energyData[yOffset] = (2*Math.abs(imageData[yOffset]      - imageData[yOffset + 1])  + 
						                       Math.abs(imageData[yOffset - xx] - imageData[yOffset + xx]) +
						                       Math.min(energyData[yOffset - xx], energyData[yOffset - xx + 1]));
					// Middle pixels (center)
			    for (x = 1; x < xx - 1; ++x) {
				    energyData[yOffset + x] = (Math.abs(imageData[yOffset + x - 1]  - imageData[yOffset + x + 1])  + 
				    	                         Math.abs(imageData[yOffset + x - xx] - imageData[yOffset + x + xx]) +
						                           Math.min(energyData[yOffset + x - xx - 1], energyData[yOffset + x - xx], energyData[yOffset + x - xx + 1])); 
			    }
			    // Last pixel (right border)
			    x = xx - 1;
				  energyData[yOffset + x] = (2*Math.abs(imageData[yOffset + x - 1]  - imageData[yOffset + x])      + 
				  	                           Math.abs(imageData[yOffset + x - xx] - imageData[yOffset + x + xx]) +
						                           Math.min(energyData[yOffset + x - xx - 1], energyData[yOffset + x - xx]));
			  }
			  // LAST ROW
			  yOffset = (yy - 1)*xx;
			  // First pixel (bottom left corner)
				energyData[yOffset] = (2*Math.abs(imageData[yOffset] - imageData[yOffset + 1])  + 
					                     2*Math.abs(imageData[yOffset - xx] - imageData[yOffset]) +
						                     Math.min(energyData[yOffset - xx], energyData[yOffset - xx + 1]));
				energyMap.max = energyData[yOffset];
				// Middle pixels (bottom border)
			  for (x = 1; x < xx - 1; ++x) {
			    energyData[yOffset + x] = (  Math.abs(imageData[yOffset + x - 1]  - imageData[yOffset + x + 1])  + 
			    	                         2*Math.abs(imageData[yOffset + x - xx] - imageData[yOffset + x]) +
						                           Math.min(energyData[yOffset + x - xx - 1], energyData[yOffset + x - xx], energyData[yOffset + x - xx + 1]));
			    if (energyData[yOffset + x] > energyMap.max) {
			    	energyMap.max = energyData[yOffset + x];
			    }
			  }
			  // Last pixel (bottom right corner)
			  x = xx - 1;
			  energyData[yOffset + x] = (2*Math.abs(imageData[yOffset + x - 1]  - imageData[yOffset + x]) + 
			  	                         2*Math.abs(imageData[yOffset + x - xx] - imageData[yOffset + x]) +
						                         Math.min(energyData[yOffset + x - xx - 1], energyData[yOffset + x - xx]));
				if (energyData[yOffset + xx - 1] > energyMap.max) {
			  	energyMap.max = energyData[yOffset + x];
			  }

			  return energyMap;
			};

/*
function: removeSeam(image: Image, seam: Array) {
  var: resized = new Image(image.width-1, image.height)
  
  for (var: y in 0..image.height):
    for (var: x in 0..seam[y]-1):
      resized(x, y) = image(x, y)
    for (var: x in seam[y]+1..resized.width-1):
      resized(x, y) = image(x, y)
  
  return: resized
}
*/
			GimelImage.prototype.removeVerticalSeam = function(seam) {
				var resized = new GimelImage(this.width - 1, this.height);
				var oldData = this.data, newData = resized.data;

				for (var y = 0, yOldOffset = 0, yNewOffset = 0, yy = this.height, xx = this.width; y < yy; ++y, yOldOffset += xx, yNewOffset += xx - 1) {
					for (var x = 0, xSeam = seam[y]; x < xSeam; ++x) {
						newData[yNewOffset + x] = oldData[yOldOffset + x];
					}
					for (++x; x < xx; ++x) {
						newData[yNewOffset + x - 1] = oldData[yOldOffset + x];
					}
				}

				return resized;
			};
		}

		GimelImage.prototype.rebuildEnergyMapAroundSeam = function(energyMap, seam) { seam = []; return energyMap; };

		GimelImage.prototype.findVerticalSeam = function(energyMap) {
			var seam = new Array(energyMap.height);
		  var energyData = energyMap.data;

		  // Last row
		  var y = energyMap.height - 1;
		  seam[y] = 0;
		  for (var x = 1, xx = energyMap.width, yOffset = y*xx; x < xx; ++x) {
		  	if (energyData[yOffset + x] < energyData[yOffset + seam[y]]) {
		  		seam[y] = x;
		  	}
		  }

		  // Remaining rows
			for (y = energyMap.height - 2, xx = energyMap.width, yOffset = y*xx; y >= 0; --y, yOffset -= xx) {
				x = seam[y] = seam[y + 1];
		    if (x > 0  && energyData[yOffset + x - 1] < energyData[yOffset + seam[y]]) {
		      seam[y] = x - 1;
		    }
		    if (x < xx && energyData[yOffset + x + 1] < energyData[yOffset + seam[y]]) {
		      seam[y] = x + 1;
		    }
		  }
		  
		  return seam;
		};

		GimelImage.prototype.retarget = function(width, height, protectMask, removeMask) {
			var retargeted = this.clone();

			var xDiff = width  - this.width;
			var yDiff = height - this.height;

			var xyOperationMask = 0x00;
			xyOperationMask += (xDiff > 0)? 0x08 : ((xDiff < 0)? 0x04 : 0x00) + (yDiff > 0)? 0x02 : ((yDiff < 0)? 0x01 : 0x00);
			/*
			switch (xyOperationMask) {
			case 0x00: // xDiff=0, yDiff=0: no operation at all; abort
				break;
			case 0x01: // xDiff=0, yDiff<0: y image reducing
			  while (yDiff < 0) {
			  	retargeted = removeVerticalSeam(retargeted, findVerticalSeam(retargeted, protectMask, removeMask));
			  	yDiff++;
			  }
				break; 
			case 0x02: // xDiff=0, yDiff>0: y image enlarging
				var halfWidth = (this.width >> 1);
				while (yDiff > halfWidth) {
					var duplicateSeamMask = new gimel.BinaryMask(retargeted.width, retargeted.height, false); 
					for (var i = 0, ii = yDiff; i < ii; i++) {
						// Mask: object method (maskObject.logicalOR...) modifies the object of the method. 
						// Static method (gimel.BinaryMask.LogicalOR...) doesn't.
						var seam = findVerticalSeam(retargeted, gimel.BinaryMask.LogicalOR(protectMask, duplicateSeamMask), removeMask);
						retargeted = duplicateVerticalSeam(retargeted, seam);
						duplicateSeamMask = duplicateVerticalSeam(duplicateSeamMask.logicalOR(seamAsMask(seam), seam);

						// develop mask support (binary, 8bits, ...). 
						// Use a mask to store chosen and duplicate seams, and combine it to the protectmask in order to avoid a pixel to be duplicate twice
						// Mask: logical OR, AND, NOT, XOR, NOR, NAND
					}
				}
				break;
			case 0x04: // xDiff<0, yDiff=0: x image reducing
			  while (xDiff < 0) {
			  	retargeted = removeHorizontalSeam(retargeted, findHorizontalSeam(retargeted, protectMask, removeMask));
			  	xDiff++;
			  }
				break;
			case 0x05: // xDiff<0, yDiff<0: x image reducing  and y image reducing
				while (xDiff < 0 || yDiff < 0) {
					var horizontalSeam = findHorizontalSeam(retargeted, protectMask, removeMask);
					var   verticalSeam = finVerticalSeam(retargeted, protectMask, removeMask);

					if (horizontalSeam.energy < verticalSeam.energy) {
						retargeted = removeHorizontalSeam(retargeted, horizontalSeam);
						xDiff++;
					} else {
						retargeted = removeVerticalSeam(retargeted, verticalSeam);
						yDiff++;
					}
				}
				break;
			case 0x06: // xDiff<0, yDiff>0: x image reducing  and y image enlarging
				break;
			case 0x08: // xDiff>0, yDiff=0: x image enlarging
				break;
			case 0x09: // xDiff>0, yDiff<0: x image enlarging and y image reducing
			case 0x0A: // xDiff>0, yDiff>0: x image enlarging and y image enlarging
			}*/
			return retargeted;
			/*
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
