// Leonardo Chiarparin, student ID 2016363

var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	
	// To correctly apply the Blinn reflection model in the absence of an ambient lighting, assuming the point being considered is not occluded by other objects, the following variables have been introduced:
	// 1) diffuseComponent and specularComponent, which respectively represent the diffuse and specular component of the aforementioned technique. Their sum yields the light contribution per source, as already discussed during lectures and implemented in the previous project
	// 2) hDirection and omegaDirection, defined to properly compute the cosine of the corresponding angles via dot products, using the dot() function
	//    In particular, 
	//    -) omegaDirection represents the direction vector from the surface point to the current light source
	//    -) hDirection is the halfway vector between the view direction and omegaDirection
	vec3 diffuseComponent, specularComponent, hDirection, omegaDirection;
	
	// At this point, a HitInfo object has been declared for then being used as a parameter of the IntersectRay() function, which checks whether the involved element is indeed in shadow or not returning a boolean value
	HitInfo hit;
	
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		
		omegaDirection = normalize( lights[i].position - position );
		 
		// After being computed as previously described, the omegaDirection vector, together with the world-space position of the shaded point (provided as a parameter of the Shade() method), is used to instantiate a new Ray object, passed to the IntersectRay() function checking for all possible intersections with the spheres in the scene  
		if( !IntersectRay( hit, Ray( position, omegaDirection ) ) ) 
		{
			// diffuseComponent = I * Kd * max(cosTheta, 0.0);
			diffuseComponent = lights[i].intensity * mtl.k_d * max( dot( normal, omegaDirection ), 0.0 );
			
			hDirection = normalize( view + omegaDirection );
			
			// specularComponent = I * Ks * pow(max(cosPhi, 0.0), materialAlpha);
			specularComponent = lights[i].intensity * mtl.k_s * pow( max( dot( normal, hDirection ), 0.0 ), mtl.n );
			
			color += diffuseComponent + specularComponent;
		}
	}
	
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	// To correctly evaluate potential intersections, few preliminary variables and assignments must be added to the code:
	// 1) the hit distance (hit.t), initialized to a large value, which effectively represents the no intersection case
	hit.t = 1e30;
	
	// 2) a boolean flag (foundHit), to track whether any intersection is detected during the loop
	bool foundHit = false;
	
	// 3) a list of temporary variables (delta, a, b, c) for solving the quadratic equation (including the discriminant), where the smallest positive root (nearT) indicates the closest intersection point  
	float delta, a, b, c, nearT;
	
	for ( int i=0; i<NUM_SPHERES; ++i ) {
		
		// For ray-sphere intersection, the following formula is used (where p and d are respectively the ray origin and direction, while c represents the center of the i-th sphere): 
		// dot(d, d) * pow(t, 2.0) + 2.0 * dot(d * (p - c)) * t + dot((p - c), (p - c)) - pow(r, 2.0) = 0, which can be rewritten in a more standard quadratic form as a * pow(t, 2.0) + b * t + c = 0   
		a = dot( ray.dir, ray.dir );
		b = 2.0 * dot( ray.dir, ( ray.pos - spheres[i].center ) );
		c = dot( ray.pos - spheres[i].center, ray.pos - spheres[i].center ) - pow( spheres[i].radius, 2.0 );
		
		delta = pow( b, 2.0 ) - ( 4.0 * a * c );
		
		// In this scenario, a positive discriminant indicates the presence of two possible intersection points, which may coincide (delta = 0) or be distinct
		if( delta >= 0.0 )
		{
			nearT = ( -1.0 * b - sqrt( delta ) ) / ( 2.0 * a ); 
			
			// Basing on the nearT value, we check whether the intesection lies in front of the ray origin and it is closer than previous hits. If so, we update the given HitInfo with the new intersection data to ensure accurate and consistent results
			if( nearT > 0.0 && nearT < hit.t ) 
			{
				foundHit = true;
				
				hit.t = nearT;
				
				// In particular,
				// 1) the world-space intersection point can be computed using the formula x = p + (t * d), which is filled with the appropriate values basing on given and obtained information 
				hit.position = ray.pos + ( nearT * ray.dir );
				
				// 2) the surface normal at the intersection point is the vector from the sphere's center to that point, divided by the sphere's radius to normalize it. Neverthless, since (p - c) already represents that distance (given an arbitrary point of the sphere), it is sufficient to apply the normalize() method as shown below 
				hit.normal = normalize( hit.position - spheres[i].center );
				
				// 3) the material of the intersected sphere must be preserved as well
				hit.mtl = spheres[i].mtl;
			}
		}
	}
	
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			// Before proceeding, the reflection ray must be initialized as follows:
			// 1) its direction is computed normalizing the outcome of the reflect(I, N) method, provided by WebGL. This function, given an incident vector I (-view) and a surface normal N (already normalized in the IntersectRay() method), returns I - 2.0 * dot(N, I) * N 
			r.dir = reflect( -view, hit.normal );
			
			// 2) the origin of the reflection ray is set at the intersection point
			r.pos = hit.position;
			
			if ( IntersectRay( h, r ) ) {
				
				// If the reflection ray hits an object, then we have to shade the new intersection point by:
				// 1) updating the view direction for the reflection (as previously done) 
				view = normalize( -r.dir );
				
				// 2) accumulating the color from the new intersection for subsequent interactions
				clr += k_s * Shade( h.mtl, h.position, h.normal, view );
				
				// 3) bringing up-to-date the material's specular coefficient for the next bounce, along with the hit information
				k_s = k_s * h.mtl.k_s;
				hit = h;
				
			} else {
				// The reflection ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;