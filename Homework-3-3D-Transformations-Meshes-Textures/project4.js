// Leonardo Chiarparin, student ID 2016363

// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	// The GetModelViewProjection function requires working with 4x4 matrices that must be represented in following format:  
	// + - - - - - - - - - - - +
	// |  [0]  [4]  [8]  [..]  | 
	// |  [1]  [5]  [9]  [..]  | 
	// |  [2]  [6]  [.]  [..]  | 
	// |  [3]  [7]  [.]  [..]  | 
	// + - - - - - - - - - - - +
	
	// As shown in the video accompanying the current homework, the transformations identified as the most appropriate for application are outlined in the following structures, whose product is computed starting from the two rightmost matrices and proceeding toward the leftmost one (partial outcomes are calculated in pairs):
	// projectionMatrix, trans, rotationXMatrix, and rotationYMatrix, with the latter two used to compute the intermediate rotationXYMatrix. These two matrices have been defined to perform the operation in a counterclockwise and a clockwise direction, respectively around x and y axes
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	
	var rotationXMatrix = [
		1, 0, 0, 0,
		0, Math.cos( rotationX ), Math.sin( rotationX ), 0,
		0, -Math.sin( rotationX ), Math.cos( rotationX ), 0,
		0, 0, 0, 1
	];
	
	var rotationYMatrix = [
		Math.cos( rotationY ), 0, -Math.sin( rotationY ), 0,
		0, 1, 0, 0,
		Math.sin( rotationY ), 0, Math.cos( rotationY ), 0,
		0, 0, 0, 1
	];
	
	var rotationXYMatrix = MatrixMult (rotationXMatrix, rotationYMatrix);
	
	return MatrixMult( projectionMatrix, MatrixMult ( trans, rotationXYMatrix ) );
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		
		this.prog = InitShaderProgram( meshVS, meshFS );
		
		// Vertex buffer
		this.vertexBuffer = gl.createBuffer();
		
		// Texture buffer 
		this.textureBuffer = gl.createBuffer();
		
		// Texture 
		this.texture = gl.createTexture();
		
		// Flags and attributes
		this.numTriangles = 0;
		
		// Shader attributes and uniform locations (maybe define an initShaderAttributes() method
		// Memorizzano gli identificatori degli attributi pos (le coordinate dei vertici nel vertex shader), texCoord(le coordinate della texture nel vertex shader) e matrice di trasformazione usata nel vertex shader
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		
		//
		this.texCoordPos = gl.getAttribLocation( this.prog, 'txc' );
		this.showTexFlagPos = gl.getUniformLocation( this.prog, 'showTexFlag' );
		
		this.sampler = gl.getUniformLocation( this.prog, 'tex' );
		
		// Una volta invocato il metodo non è più possibile cambiare il valore della matrice di interesse, pertanto ho inserito nel vertex shader anche un parametro aggiuntivo così da poterlo gestire nell'eventualità in cui ci sia lo wap tra y e z
		this.swapYZMatrixPos = gl.getUniformLocation( this.prog, 'swapYZMatrix' );
		// Flag per discriminare il prodotto, altrimenti undefined
		this.swapYZFlagPos = gl.getUniformLocation( this.prog, 'swapYZFlag' );
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;
		
		// Upload vertex positions to GPU
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertPos ), gl.STATIC_DRAW );
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.textureBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( texCoords ), gl.STATIC_DRAW );
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{	
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram( this.prog );
		gl.uniform1i( this.swapYZFlagPos, swap ? true : false );
		gl.uniformMatrix4fv( this.swapYZMatrixPos, false, swap ? new Float32Array( [ 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1 ] ) : new Float32Array( [ 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1 ] ) );
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );
        
        // Pass transformation matrix to shader
        gl.uniformMatrix4fv( this.mvp, false, trans );

        // Bind vertex position buffer
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
        gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.textureBuffer );
        gl.vertexAttribPointer( this.texCoordPos, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.texCoordPos );
		
        // Draw the triangles
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{	
		// [TO-DO] Bind the texture
		gl.activeTexture( gl.TEXTURE0 );
		
		gl.bindTexture( gl.TEXTURE_2D, this.texture );

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		
		gl.generateMipmap( gl.TEXTURE_2D );
		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
		
		gl.useProgram( this.prog );
		gl.uniform1i( this.sampler, 0 );
		gl.uniform1i( this.showTexFlagPos, true );
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram( this.prog );
		gl.uniform1i( this.showTexFlagPos, show ? true : false );
	}
}

var meshVS = `
	attribute vec3 pos;
	attribute vec2 txc;
	
	uniform mat4 mvp;
	uniform mat4 swapYZMatrix;
	uniform bool swapYZFlag;
	uniform bool showTexFlag;
	
	varying vec2 texCoord;
	
	void main()
	{
		
		if( swapYZFlag == true ) 
			gl_Position = mvp * swapYZMatrix * vec4( pos, 1 );
		else
			gl_Position = mvp * vec4( pos, 1 );
		
		texCoord = txc;
	}
`; 

// The fragment shader code for the MeshDrawer class has been changed in order to set the color for each fragment dinamically (following the suggestion on the web page), instead of applying a single one to the entire object
var meshFS = `
	precision mediump float;
	
	uniform sampler2D tex;
	uniform bool showTexFlag;
	
	varying vec2 texCoord;
	
	void main()
	{
		if ( showTexFlag == true )
			gl_FragColor = texture2D( tex, texCoord );
		else
			gl_FragColor = vec4( 1, gl_FragCoord.z * gl_FragCoord.z, 0, 1 );
		
	}
`;