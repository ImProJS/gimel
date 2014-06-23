gimel.module('imageTemplate').extend(function(moduleContent) {
    gimel.imageTemplate.extend(function(GimelImage, dataType, channels) {
        GimelImage.ImageView = function ImageView(image, x, y, width, height) {
            this.image = image;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.dx = image.dx;
            this.dy = image.dy;
        };

        GimelImage.ImageView.prototype.CHANNELS = GimelImage.prototype.CHANNELS;
        GimelImage.ImageView.prototype.DATA_TYPE = GimelImage.prototype.DATA_TYPE;

        GimelImage.prototype.getImageView = function(x, y, width, height) {
            return new GimelImage.ImageView(this, x, y, width, height);
        };

        GimelImage.ImageView.prototype.getImageView = function(x, y, width, height) {
            return new GimelImage.ImageView(this.image, this.x + x, this.y + y, width, height);
        };
    });
});