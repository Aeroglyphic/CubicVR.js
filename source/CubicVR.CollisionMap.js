CubicVR.RegisterModule("CollisionMap",function(base) {

  var undef = base.undef;
  var util = CubicVR.util;
  var vec3 = CubicVR.vec3;
  var enums = CubicVR.enums;

  enums.collision = {
    shape: {
      BOX: 0,
      SPHERE: 1,
      CAPSULE: 2,
      MESH: 3,
      HEIGHTFIELD: 4
    }
  };

  var CollisionMap = function(cmap_objs) {
    this.shapes = [];
    
    if (cmap_objs && !cmap_objs.length) {
      cmap_objs = [cmap_objs];
    }
    
    for (var i = 0, iMax = cmap_objs.length; i<iMax; i++) {
      this.addShape(cmap_objs[i]);
    }
  };
  
  CollisionMap.prototype = {
    addShape: function(shape_in) {
      shape_in.position = shape_in.position||[0,0,0];
      shape_in.rotation = shape_in.rotation||[0,0,0];
      shape_in.size = shape_in.size||[1,1,1];
      shape_in.radius = shape_in.radius||1;
      shape_in.height = shape_in.height||1;
      shape_in.margin = shape_in.margin||0.0;
      shape_in.mesh = shape_in.mesh||null;
 
      this.shapes.push(shape_in);
    },
    getShapes: function() {
      return this.shapes;       
    }
  };
  
  var extend = {
    CollisionMap: CollisionMap
  };
  
  return extend;
});
