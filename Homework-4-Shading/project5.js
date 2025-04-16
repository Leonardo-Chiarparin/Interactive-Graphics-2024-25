// Leonardo Chiarparin, student ID 2016363

// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// The GetModelViewProjection function requires working with 4x4 matrices that must be represented in following format:  
	// + - - - - - - - - - - - +
	// |  [0]  [4]  [8]  [..]  | 
	// |  [1]  [5]  [9]  [..]  | 
	// |  [2]  [6]  [.]  [..]  | 
	// |  [3]  [7]  [.]  [..]  | 
	// + - - - - - - - - - - - +
	
	// As shown in the video accompanying the current homework, the transformations identified as the most appropriate for application are outlined in the following structures, whose product is computed starting from the two rightmost matrices and proceeding toward the leftmost one (partial outcomes are calculated in pairs):
	// trans, rotationXMatrix, and rotationYMatrix, with the latter two used to compute the intermediate rotationXYMatrix. These two matrices have been defined to perform the operation in a counterclockwise and a clockwise direction, respectively around x and y axes
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
	
	// Unlike the previous project, the third one, this function does not take the projectionMatrix as an argument anymore, so it should return only the part of the transformation prior to the projection
	return MatrixMult( trans, rotationXYMatrix );
}

// The following class, whose basic structure was already provided in the original code, has been completed according to the suggested guidelines. It now includes all the necessary elements (instructions, variables, ...) for the MeshDrawer object to render a 3D triangular mesh, applying optional texture and shading
class MeshDrawer
{
	constructor()
	{
		// Before proceeding, the shader program must be compiled using the InitShaderProgram function, which manages all the necessary steps for the shaders' inizialization and it is also invoked in the BoxDrawer class. In this case, the difference lies in the parameters passed to it, since the behavior required for rendering a textured 3D mesh slightly varies from that of drawing the box lines
		this.prog = InitShaderProgram( meshVS, meshFS );
		
		// Up to this point, several elements need to be introduced for a variety of important reasons:
		
		// 1) Buffers: memory blocks on the GPU used to store information needed for rendering, such as vertex positions, normal vectors and texture coordinates
		this.vertexBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();
		this.textureBuffer = gl.createBuffer();
		
		// Texture's object
		this.texture = gl.createTexture();
		
		// Class's attributes
		this.numTriangles = 0;
		
		// Shader's attributes and uniform locations// 2) Texture object: essential for mapping loaded images onto 3D subjects, which helps to achieve realistic visuals by adding surface details. This object will be populated with the appropriate image data for use in the rendering pipeline
		this.texture = gl.createTexture();
		
		// 3) Class's attribute: ensuring consistency with the instruction in the original code's setMesh method. The current element will be used to determine the actual number of triangles to be drawn 
		this.numTriangles = 0;
		
		// 4) Shader attributes and uniform locations: avoiding repeated queries to the WebGL context and guaranteeing that data are correctly passed to shaders
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
		
		// Previous locations, as shown in the GSLS codes, refer to elements that were introduced to enable the implementation of various operations:
		// -) swapYZFlag determines whether to apply the swapYZMatrix to the mvp * vec4(pos,1) product in the vertex shader. Its content changes based on the status of the corresponding checkbox, eventually swapping the y and z axis columns
		// -) nor refers to normal vectors used to compute their view space representation as matrixNormal * nor starting from their model-view coordinates, so that the Blinn material model can be correctly applied (similarly to lightDirection and materialAlpha, which can be freely adjusted through their respective sections). Neverthless, this transformation involves the inverse-transpose of the 3x3 model-view matrix, whose uniform location is given by matrixNormalPos   
		// -) showTexFlag manages cases where the current texture should not be longer displayed
		// -) all other entities, except for texture coordinates and the sampler, are essentially analogous to those defined in the BoxDrawer class
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
		this.numTriangles = vertPos.length / 3;
		
		// Up to this point, vertex positions (x, y, z), normal vectors (x, y, z) and texture coordinates (u, v -> s, t) must be uploaded to the GPU by binding and using the previously defined buffers to correcly manage these details. In this case, the constant gl.STATIC_DRAW has been specified in the gl.bufferData method to indicate that the buffers' content will not change frequently after inizialization
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
		// Before proceeding, the shader program must be activated to prevent errors related to certain elements not referencing it, ensuring the correct execution of subsequent WebGL operations
		gl.useProgram( this.prog );
		
		// It is worth noting that this is not an issue at all, since at every small change the control is passed to the BoxDrawer (shader) program first, making its specification after the following instructions entirely redundant
		
		// Based on the status of the corresponding checkbox, the value of the swapYZFlag uniform (a boolean, whose value remains the same for all processed vertices or fragments during the single draw call) must be set using a ternary operator, which assigns true if swap is truthy, and false otherwise
		gl.uniform1i( this.swapYZFlagPos, swap ? true : false );
		
		// Similar to the swapYZFlag, the swapYZMatrix uniform (treated as a vector in column-major order) requires a dynamic handling based on the previously mentioned reference (swap), whose value determines which one of the two possible matrices will be produced:
		
		// -) If swap is truthy, a matrix that swaps the y and z axes is created, changing the positions of y and z columns
		//    + - + - + - + - + 
		//    | 1 | 0 | 0 | 0 | 
		//    + - + - + - + - + 
		//    | 0 | 0 | 1 | 0 | 
		//    + - + - + - + - + 
		//    | 0 | 1 | 0 | 0 | 
		//    + - + - + - + - +
		//    | 0 | 0 | 0 | 1 |   
		//    + - + - + - + - + 
		
		// -) Otherwise, the identity matrix is retrieved
		//    + - + - + - + - + 
		//    | 1 | 0 | 0 | 0 | 
		//    + - + - + - + - + 
		//    | 0 | 1 | 0 | 0 | 
		//    + - + - + - + - + 
		//    | 0 | 0 | 1 | 0 | 
		//    + - + - + - + - +
		//    | 0 | 0 | 0 | 1 |   
		//    + - + - + - + - + 
		
		gl.uniformMatrix4fv( this.swapYZMatrixPos, false, swap ? new Float32Array( [ 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1 ] ) : new Float32Array( [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ] ) );
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		gl.useProgram( this.prog );
        
		// First, the transformation matrices (matrixMVP analogous to the trans matrix from the previous homework, matrixMV for obtaining the view space representation of vertex positions and matrixNormal) need to be passed to the vertex shader, sending their non-transposed version, as WebGL uses column-major order by default, to the mvp, mv and matrixNormal uniforms, respectively
        gl.uniformMatrix4fv( this.mvp, false, matrixMVP );
		gl.uniformMatrix4fv( this.mv, false, matrixMV );
		gl.uniformMatrix3fv( this.matrixNormalPos, false, matrixNormal );

		// Up to this point, the following three instructions are required for:
		
		// 1) binding the vertex position buffer to the ARRAY_BUFFER target, preparing that structure for use in the shader
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
        
		// 2) defining how vertex positions are read from it, specifying the number of components (3 -> x, y, z), the data type, and additional parameters, including no normalization 
        gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		
		// 3) enabling the vertex position attribute
		gl.enableVertexAttribArray( this.vertPos );
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalBuffer );
        gl.vertexAttribPointer( this.norPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.norPos );
		
		// The same approach is also applied to the texture coordinates, with some adjustment for their properties (i.e. 2 components instead of 3 as with vertex positions)
		gl.bindBuffer( gl.ARRAY_BUFFER, this.textureBuffer );
        gl.vertexAttribPointer( this.txcPos, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.txcPos );
		
		// In conclusion, the triangles, whose shape/primitive has been stated using gl.TRIANGLES, are drawn considering the data in the buffers and specifying some parameter, such as the offset in that structure (equal to 0) and the number of elements to be rendered
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// Before proceeding, the texture must be assigned to an active texture unit (TEXTURE0, the first available one) to ensure that all consecutive operations properly use it
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, this.texture );

		// Up to this point, the image data (provided as an <img> HTML tag) needs to be loaded into the texture object, specifying its format (gl.RGB) and data type (gl.UNSIGNED_BYTE)
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		
		// The texture parameters has been set to perform the following operations:
		
		// 1) generate the mipmap for the texture, allowing WebGL to choose the appropriate texture level for different distances or sizes 
		gl.generateMipmap( gl.TEXTURE_2D );
		
		// 2) manage how the texture has to be filtered and wrapped, in particular:
		
		// -) gl.TEXTURE_MAG_FILTER specifies the technique used to magnify the texture when it is stretched and appears larger than its original size (zoom-in); gl.LINEAR provides a smooth scaling
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
		
		// -) gl.TEXTURE_MIN_FILTER " " " " " shrink " " " " minified " " smaller " " " " (zoom-out); gl.LINEAR_MIPMAP_LINEAR " " " interpolation 
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
		
		// -) gl.TEXTURE_WRAP_S and gl.TEXTURE_WRAP_T specify the techniques used to manage texture coordinates (u, v -> s, t) exceeding the [0,1] range in the horizontal (S) and vertical (T) directions; gl.REPEAT (tiling mode) replays the texture itself
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
		
		gl.useProgram( this.prog );
		
		// In conclusion, the sampler uniform in the fragment shader is configured allowing the shader to sample the texture from the unit (TEXTURE0) to which it was previously bound
		gl.uniform1i( this.sampler, 0 );
		
		// Furthermore, after loading the texture, it must be immediately displayed by assigning a true value to the showTexFlag uniform
		gl.uniform1i( this.showTexFlagPos, true );
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// Similar to the swapYZ function, the value of the showTexFlag uniform (a boolean) needs to be changed based on the status of the corresponding checkbox (denoted by the show variable)
		gl.useProgram( this.prog );
		gl.uniform1i( this.showTexFlagPos, show ? true : false );
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// Similar to the swapYZ function, the value of the lightDirection uniform (a 3D vector) needs to be changed based on the status of the corresponding section
		gl.useProgram( this.prog );
		gl.uniform3f( this.lightDirectionPos, x, y, z );
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// Similar to the swapYZ function, the value of the materialAlpha uniform (a float) needs to be changed based on the value of the corresponding section
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
		// In order to correcly apply the Blinn reflection model, the following approach has been adopted:
		// 1) diffuseComponent, which represents Kd in the aforementioned technique, varies depending on whether a texture is present. If not, the base color is assumed to be white, represented as a 4D vector according to the RGBA format
		// 2) specularComponent, Ks to be more accurate, is always initialized to white, as indicated on the project's webpage
		// 3) lightIntensity, as per the requirements, has been set to white. Furthermore, the ambient light has been omitted since the interface of the program does not include any control about it 
		// 4) direction vectors, e.g. lightDirection, have been properly normalized before being involved in some calculation
		// 5) scalar products to compute cosTheta and cosPhi are performed using the dot function and comparing them to 0.0, disregarding any possible negative value
		// Neverthless, C = I * (cosTheta * Kd + Ks * (pow(cosPhi), materialAlpha))
		
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