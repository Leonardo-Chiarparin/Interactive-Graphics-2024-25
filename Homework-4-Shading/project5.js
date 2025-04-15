// Leonardo Chiarparin, student ID 2016363

// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
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
	
	return MatrixMult( trans, rotationXYMatrix );
	
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		this.prog = InitShaderProgram( meshVS, meshFS );
		
		// Buffers
		this.vertexBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();
		this.textureBuffer = gl.createBuffer();
		
		// Texture's object
		this.texture = gl.createTexture();
		
		// Class's attributes
		this.numTriangles = 0;
		
		// Shader's attributes and uniform locations
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		
		this.mv = gl.getUniformLocation( this.prog, 'mv' );
		
		this.norPos = gl.getAttribLocation( this.prog, 'nor' );
		this.matrixNormalPos = gl.getUniformLocation( this.prog, 'matrixNormal' );
		
		this.lightDirectionPos = gl.getUniformLocation( this.prog, 'lightDirection' );
		this.materialAlphaPos = gl.getUniformLocation( this.prog, 'materialAlpha' );
		
		this.sampler = gl.getUniformLocation( this.prog, 'tex' );
		
		this.txcPos = gl.getAttribLocation( this.prog, 'txc' );
		this.showTexFlagPos = gl.getUniformLocation( this.prog, 'showTexFlag' );
		
		this.swapYZMatrixPos = gl.getUniformLocation( this.prog, 'swapYZMatrix' );
		this.swapYZFlagPos = gl.getUniformLocation( this.prog, 'swapYZFlag' );
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertPos ), gl.STATIC_DRAW );
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( normals ), gl.STATIC_DRAW );
		
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
		gl.uniformMatrix4fv( this.swapYZMatrixPos, false, swap ? new Float32Array( [ 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1 ] ) : new Float32Array( [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ] ) );
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );
        gl.uniformMatrix4fv( this.mvp, false, matrixMVP );
		gl.uniformMatrix4fv( this.mv, false, matrixMV );
		gl.uniformMatrix3fv( this.matrixNormalPos, false, matrixNormal );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
        gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalBuffer );
        gl.vertexAttribPointer( this.norPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.norPos );
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.textureBuffer );
        gl.vertexAttribPointer( this.txcPos, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.txcPos );
		
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
		
		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.generateMipmap( gl.TEXTURE_2D );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
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
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram( this.prog );
		gl.uniform3f( this.lightDirectionPos, x, y, z );
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram( this.prog );
		gl.uniform1f( this.materialAlphaPos, shininess );
	}
}
var meshVS = `
	attribute vec3 pos;
	attribute vec3 nor;
	attribute vec2 txc;
	
	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 matrixNormal;
	uniform mat4 swapYZMatrix;
	uniform bool swapYZFlag;
	
	varying vec4 position;
	varying vec3 normal;
	varying vec2 texCoord;
	
	void main()
	{
		
		if( swapYZFlag == true ) 
			gl_Position = mvp * swapYZMatrix * vec4( pos, 1 );
		else
			gl_Position = mvp * vec4( pos, 1 );
		
		position = mv * vec4( pos, 1 );
		normal = matrixNormal * nor;
		texCoord = txc;
	}
`; 

var meshFS = `
	precision mediump float;
	
	uniform vec3 lightDirection;
	uniform float materialAlpha;
	uniform sampler2D tex;
	uniform bool showTexFlag;
	
	varying vec4 position;
	varying vec3 normal;
	varying vec2 texCoord;
	
	void main()
	{
		vec4 diffuseComponent, specularComponent = vec4( 1, 1, 1, 1 );
		float lightIntensity = 1.0;
		vec3 viewDirection = normalize( vec3( -position ) ), hDirection = normalize( lightDirection + viewDirection );
		
		if ( showTexFlag == true )
			diffuseComponent = texture2D( tex, texCoord );
		else
			diffuseComponent = vec4( 1, 1, 1, 1 );
		
		gl_FragColor = lightIntensity * ( max( 0.0, dot( normalize( normal ), normalize( lightDirection ) ) ) * diffuseComponent + specularComponent * pow( max( 0.0, dot( normalize( normal ), hDirection ) ), materialAlpha ) );
	}
`;