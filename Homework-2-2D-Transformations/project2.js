// Leonardo Chiarparin, student ID 2016363

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	// Both the GetTransform and ApplyTransform functions require working with 3x3 matrices that must be represented in following format:  
	// + - - - - - - - - +
	// |  [0]  [3]  [6]  | 
	// |  [1]  [4]  [7]  | 
	// |  [2]  [5]  [8]  | 
	// + - - - - - - - - +
	
	// As mentioned in the text, three 2D transformations must be performed in a specific order (1st -> Scaling, 2nd -> Rotation, 3rd -> Translation):
	// + - - - - - - - - - +   + - - - - - - - - - - - - - - - - - - +   + - - - - - - - - - +
	// |  1  0  positionX  |   |  cos(+rotation)  sin(-rotation)  0  |   |  scale    0    0  |
	// |  0  1  positionY  | x |  sin(+rotation)  cos(+rotation)  0  | x |    0    scale  0  |
	// |  0  0      0      |   |         0              0         1  |   |    0      0    1  |
	// + - - - - - - - - - +   + - - - - - - - - - - - - - - - - - - +   + - - - - - - - - - +
	
	// In particular, the matrix representing the overall transformation can be obtained by first computing the product of the two rightmost matrices, then applying the same operation to their outcome and the remaining leftmost matrix 
	// Up to this point, and before moving on, we need to create all the required structures properly		
	let scaleMatrix = Array( scale, 0, 0, 0, scale, 0, 0, 0, 1 );
	
	// Since the Math.cos and Math.sin static methods require an agle expressed in radians, the rotation value (in degree) must be converted and updated
	rotation = rotation * ( Math.PI / 180 );
	
	let rotationMatrix = Array( Math.cos( rotation ), Math.sin( rotation ), 0, -Math.sin( rotation ), Math.cos( rotation ), 0, 0, 0, 1 );
	
	let translationMatrix = Array( 1, 0, 0, 0, 1, 0, positionX, positionY, 1 );
	
	// To compute the partial product (the multiplication of scaleMatrix and rotationMatrix), we can simply refer to the ApplyTransform(trans1, trans2) function, where the first parameter rapresents the trasformation which has to be applied first, the rightmost matrix in the product
	tempMatrix = ApplyTransform( scaleMatrix, rotationMatrix );
	
	// In conclusion, the final matrix can be returned as previously suggested, by computing the product of tempMatrix and the translationMatrix
	return ApplyTransform( tempMatrix, translationMatrix );
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	// Before proceeding, it is necessary to verify that both trans1 and trans2 are arrays of exactly 9 elements
	// If they are not, the Identity Matrix is returned to ensure no changes occur 
	if ( trans1.length != 9 || trans2.length != 9 )
		return Array( 1, 0, 0, 0, 1, 0, 0, 0, 1);
	
	// To automate the computation of the product, a vector (resultMatrix) has been defined to store the intermediate outcomes, whose reference will be then returned to the calling function
	let resultMatrix = Array( 0, 0, 0, 0, 0, 0, 0, 0, 0 ); 
	
	// Since we are dealing with vectors stored in a column-major order, the components must be accessed using a three-level nested control structure:
	// -) the outer loop iterates over columns (j) of the resulting matrix (same as columns of trans1), the middle one over its rows (i, same as rows of trans2)
	// -) the innermost loop is responsible for computing the dot product between the corresponding row of trans2 [(k * 3) + i] and column of trans1 [(j * 3) + k]
	//         trans2              trans1
	// (k * 3) + i  ...  ...     j
	//      + - + - + - +      + - + - + - +
	//   i  | x | x | x |      | x |   |   |  ( j * 3 ) + k
	//      + - + - + - +      + - + - + - +
	//      |   |   |   |      | x |   |   |  ...
	//      + - + - + - +      + - + - + - +
	//      |   |   |   |      | x |   |   |  ...
	//      + - + - + - +      + - + - + - +
	for ( let j = 0; j < 3; j++ )
	{
		for ( let i = 0; i < 3; i++ )
		{
			for ( let k = 0; k < 3; k++ ) 
			{
				resultMatrix[ ( j * 3 ) + i ] += trans2[ ( k * 3 ) + i ] * trans1[ ( j * 3 ) + k ];
			}
		}
	}
	
	return resultMatrix;
	
	// Alternatively, instead of following the previous instructions, we could have computed the product manually by simply writing return Array((trans2[0] * trans1[0]) + (trans2[3] * trans1[3]) + (trans2[6] * trans1[6]), ..., ..., ..., ..., ..., ..., ..., ...)
}