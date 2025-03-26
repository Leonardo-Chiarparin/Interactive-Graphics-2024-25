// Leonardo Chiarparin, student ID 2016363

// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{
	// For each point in the foreground image, Alpha Blending must be applied to the corresponding background pixel it overlays
	// In this case, the perimeter where those elements are located can be determined by considering the plane with dimensions fgImg.width and fgImg.height
	for ( let i = 0; i < fgImg.width; i++ ) 
	{
		for ( let j = 0; j < fgImg.height; j++ ) 
		{
			// Up to this point, and before moving on, we need to check whether the current pixel of the foregound image is out of the background bounds and ignore it if necessary
			// Each point should be considered relative to the position of the top-left pixel of the foreground image, represented by the attributes x and y of the Object fgPos
			x = i + fgPos.x;
			y = j + fgPos.y;
			
			// The top-left corner of the background is represented by the point [0,0], while the bottom-right one is at [bgImg.width-1, bgImg.height-1]
			if ( ! ( x < 0 || x > ( bgImg.width - 1) || y < 0 || y > ( bgImg.height - 1 ) ) ) 
			{
				// To correctly compute the alpha values, we need to consider the structure of the image data arrays (fgImg.data, bgImg.data), in which each pixel is represented by four consecutive elements:
				// 0) Red (R) at index 0
				// 1) Green (G) at index 1
				// 2) Blue (B) at index 2
				// 3) Alpha (A) at index 3, whose value belongs to the [0,255] range
				
				// Since the images are stored in a row-major order and treated as 1D vectors, we need to compute the indeces corresponding to the given pixel's location, adjusting their value to account the four RGBA channels (* 4) correctly
				// From a "cartesian" perspective, the index of a pixel in a certain image (with a given width) can be determined by considering the following representation:
				//           i -> moves across columns
				// + - + - + - + - + - + > (x-axis)
				// |   |   |   |   |   |
				// + - + - + - + - + - +
				// |   |   | x |   |   |  j * width -> retrieves the current row
				// + - + - + - + - + - +
				// |   |   |   |   |   |
				// + - + - + - + - + - +
				// |   |   |   |   |   |
				// + - + - + - + - + - +
				// v
				// (y-axis)
				
				fgIndex = ( j * fgImg.width + i ) * 4;
				bgIndex = ( y * bgImg.width + x ) * 4;
				
				// The target element (the foreground pixel's alpha, obtained from the fgImg.data array at fgIndex + 3) must be normalized by dividing its value by 255, scaling it from [0,255] (8 bit) range to [0,1], and then multiplied by fgOpac, in order to apply the defined opacity adjustment
				fgAlpha = ( fgImg.data[ fgIndex + 3 ] / 255 ) * fgOpac;
				
				// Up to this point, it is possible to compute the derived transparency for the background pixel, as it can be determined starting from the transparency of the foreground pixel
				alphaFromFg = 1 - fgAlpha;
				
				// In conclusion, Alpha Blending must be performed by applying the equation of the Normal Blending Mode to each color channel (R = > bgImg.data[index], G = > bgImg.data[index + 1], B = > bgImg.data[index + 2]) of the background pixel, considering that the latter has its own alpha (bgAlpha)
				bgAlpha = bgImg.data[ bgIndex + 3 ] / 255;
				alpha = fgAlpha + alphaFromFg * bgAlpha;
				
				bgImg.data[ bgIndex ] = ( fgImg.data[ fgIndex ] * fgAlpha + bgImg.data[ bgIndex ] * alphaFromFg * bgAlpha ) / alpha;
				bgImg.data[ bgIndex + 1 ] = ( fgImg.data[ fgIndex + 1 ] * fgAlpha + bgImg.data[ bgIndex + 1 ] * alphaFromFg * bgAlpha ) / alpha;
				bgImg.data[ bgIndex + 2 ] = ( fgImg.data[ fgIndex + 2 ] * fgAlpha + bgImg.data[ bgIndex + 2 ] * alphaFromFg * bgAlpha ) / alpha;
				
				// Furthermore, the alpha value of the current background pixel must be updated to the content of the variable "alpha", whose value must be brought back within the [0,255] range to properly preserve all the introduced changes
				bgImg.data[ bgIndex + 3 ] = alpha * 255;
			}
		}
	}
}