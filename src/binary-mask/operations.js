gimel.module('binaryMask').extend(function(moduleContent) {
		// BASIC LOGICAL OPERATORS: NOT, AND, OR, XOR

		/**
     * Logical NOT operation. Set operation: complement
     * @param {BinaryMask} mask - the given mask
     * @param {BinaryMask} dest - mask on which the result is written (mask, this...). If undefined, create a new mask
     * @return {BinaryMask} dest mask
     */
		var NOT = function(mask, dest) {
				dest = dest || new gimel.BinaryMask(mask.width, mask.height);

				var maskData = mask.data;
				var destData = dest.data;

				for (var t = 0, tt = mask.length; t < tt; ++t) {
	    			destData[t] = (maskData[t])? 0x00 : 0xff;
	    	}

	    	return dest;
		};

		/**
     * Logical AND operation. Set operation: intersection
     * @param {BinaryMask} mask1 - the first mask
     * @param {BinaryMask} mask2 - the second mask
     * @param {BinaryMask} dest - mask on which the result is written (mask1, mask2, this...). If undefined, create a new mask
     * @return {BinaryMask} dest mask
     */
		var AND = function(mask1, mask2, dest) {
				dest = dest || new gimel.BinaryMask(mask1.width, mask1.height);

				var mask1Data = mask1.data;
				var mask2Data = mask2.data;
				var destData = dest.data;

				for (var t = 0, tt = mask1.length; t < tt; ++t) {
	    			destData[t] = (mask1Data[t] & mask2Data[t])? 0xff : 0x00;
	    	}

	    	return dest;
		};

		/**
     * Logical OR operation. Set operation: union
     * @param {BinaryMask} mask1 - the first mask
     * @param {BinaryMask} mask2 - the second mask
     * @param {BinaryMask} dest - mask on which the result is written (mask1, mask2, this...). If undefined, create a new mask
     * @return {BinaryMask} dest mask
     */
		var OR = function(mask1, mask2, dest) {
				dest = dest || new gimel.BinaryMask(mask1.width, mask1.height);

				var mask1Data = mask1.data;
				var mask2Data = mask2.data;
				var destData = dest.data;

				for (var t = 0, tt = mask1.length; t < tt; ++t) {
	    			destData[t] = (mask1Data[t] | mask2Data[t])? 0xff : 0x00;
	    	}

	    	return dest;
		};

		/**
     * Logical XOR operation. Set operation: symmetric difference
     * @param {BinaryMask} mask1 - the first mask
     * @param {BinaryMask} mask2 - the second mask
     * @param {BinaryMask} dest - mask on which the result is written (mask1, mask2, this...). If undefined, create a new mask
     * @return {BinaryMask} dest mask
     */
		var XOR = function(mask1, mask2, dest) {
				dest = dest || new gimel.BinaryMask(mask1.width, mask1.height);

				var mask1Data = mask1.data;
				var mask2Data = mask2.data;
				var destData = dest.data;

				for (var t = 0, tt = mask1.length; t < tt; ++t) {
	    			destData[t] = (mask1Data[t] ^ mask2Data[t])? 0xff : 0x00;
	    	}

	    	return dest;
		};

		// Class methods: result on a new mask
		gimel.BinaryMask.not           = function(mask)         { return NOT(mask);         };
		gimel.BinaryMask.and           = function(mask1, mask2) { return AND(mask1, mask2); };
		gimel.BinaryMask.or            = function(mask1, mask2) { return  OR(mask1, mask2); };
		gimel.BinaryMask.xor           = function(mask1, mask2) { return XOR(mask1, mask2); };
		gimel.BinaryMask.complement    = function(mask)         { return NOT(mask);         };
		gimel.BinaryMask.intersection  = function(mask1, mask2) { return AND(mask1, mask2); };
		gimel.BinaryMask.union         = function(mask1, mask2) { return  OR(mask1, mask2); };
		gimel.BinaryMask.symDifference = function(mask1, mask2) { return XOR(mask1, mask2); };
		// Object methods: result on caller mask
    gimel.BinaryMask.prototype.not           = function()     { return NOT(this,       this); };
    gimel.BinaryMask.prototype.and           = function(mask) { return AND(this, mask, this); };
    gimel.BinaryMask.prototype.or            = function(mask) { return  OR(this, mask, this); };
    gimel.BinaryMask.prototype.xor           = function(mask) { return XOR(this, mask, this); };
    gimel.BinaryMask.prototype.complement    = function()     { return NOT(this,       this); };
    gimel.BinaryMask.prototype.intersection  = function(mask) { return AND(this, mask, this); };
    gimel.BinaryMask.prototype.union         = function(mask) { return  OR(this, mask, this); };
    gimel.BinaryMask.prototype.symDifference = function(mask) { return XOR(this, mask, this); };



    // ADVANCED OPERATORS: difference, ...

    /**
     * Logical A AND NOT B operation. Set operation: difference
     * @param {BinaryMask} mask1 - the first mask
     * @param {BinaryMask} mask2 - the second mask
     * @param {BinaryMask} dest - mask on which the result is written (mask1, mask2, this...). If undefined, create a new mask
     * @return {BinaryMask} dest mask
     */
    var difference = function(mask1, mask2, dest) {
				dest = dest || new gimel.BinaryMask(mask1.width, mask1.height);

				var mask1Data = mask1.data;
				var mask2Data = mask2.data;
				var destData = dest.data;

				for (var t = 0, tt = mask1.length; t < tt; ++t) {
	    			destData[t] = (mask1Data[t] & !mask2Data[t])? 0xff : 0x00;
	    	}

	    	return dest;
    };

		// Class methods: result on a new mask
		gimel.BinaryMask.difference = function(mask1, mask2) { return difference(mask1, mask2); };
		// Object methods: result on caller mask
    gimel.BinaryMask.prototype.difference = function(mask) { return difference(this, mask, this); };

});
