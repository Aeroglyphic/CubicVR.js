
CubicVR.RegisterModule("Shader",function(base) {

  var undef = base.undef;
  var GLCore = base.GLCore;
  var enums = CubicVR.enums;    
  var log = base.log;
  var util = CubicVR.util;

  // Shader Map Inputs (binary hash index)
  enums.shader = {
    map: {
      COLOR: 1,
      SPECULAR: 2,
      NORMAL: 4,
      BUMP: 8,
      REFLECT: 16,
      ENVSPHERE: 32,
      AMBIENT: 64,
      ALPHA: 128,
      COLORMAP: 256
    },

    /* Uniform types */
    uniform: {
      MATRIX: 0,
      VECTOR: 1,
      FLOAT: 2,
      ARRAY_VERTEX: 3,
      ARRAY_UV: 4,
      ARRAY_FLOAT: 5,
      INT: 6
    }
  };


  var cubicvr_compileShader = function(gl, str, type) {
    var shader;

    if (type === "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type === "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      log(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  };

  var cubicvr_getShader = function(gl, id) {
    var shaderScript = document.getElementById(id);

    if (!shaderScript) {
      return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
      if (k.nodeType === 3) {
        str += k.textContent;
      }
      k = k.nextSibling;
    }

    var shader;

    if (shaderScript.type === "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type === "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      log(gl.getShaderInfoLog(shader));
//      return null;
    }

    return shader;
  };

  /* Shaders */

  function Shader(vs_id, fs_id) {
    var util = CubicVR.util;
    var vertexShader;
    var fragmentShader;
    var loadedShader;

    this.uniforms = [];
    this.uniform_type = [];
    this.uniform_typelist = [];

    if (vs_id.indexOf("\n") !== -1) {
      vertexShader = cubicvr_compileShader(GLCore.gl, vs_id, "x-shader/x-vertex");
    } else {
      vertexShader = cubicvr_getShader(GLCore.gl, vs_id);

      if (vertexShader === null) {
        loadedShader = util.getURL(vs_id);

        vertexShader = cubicvr_compileShader(GLCore.gl, loadedShader, "x-shader/x-vertex");
      }
    }

    if (fs_id.indexOf("\n") !== -1) {
      fragmentShader = cubicvr_compileShader(GLCore.gl, fs_id, "x-shader/x-fragment");
    } else {
      fragmentShader = cubicvr_getShader(GLCore.gl, fs_id);

      if (fragmentShader === null) {
        loadedShader = util.getURL(fs_id);

        fragmentShader = cubicvr_compileShader(GLCore.gl, loadedShader, "x-shader/x-fragment");
      }

    }


    this.shader = GLCore.gl.createProgram();
    GLCore.gl.attachShader(this.shader, vertexShader);
    GLCore.gl.attachShader(this.shader, fragmentShader);
    GLCore.gl.linkProgram(this.shader);

    if (!GLCore.gl.getProgramParameter(this.shader, GLCore.gl.LINK_STATUS)) {
      throw new Error("Could not initialise shader vert(" + vs_id + "), frag(" + fs_id + ")");
    }
  }


  Shader.prototype = {
    bindSelf: function(uniform_id) {  
      var t,k,p,v;
      
      if (uniform_id.indexOf(".")!==-1) {
        if (uniform_id.indexOf("[")!==-1) {
          t = uniform_id.split("[");
          p = t[0];
          t = t[1].split("]");
          k = t[0];
          t = t[1].split(".");
          v = t[1];
          
          if (this[p] === undef) {
            this[p] = [];
          }
          if (this[p][k] === undef) {
            this[p][k] = {};
          }
          
          this[p][k][v] = this.uniforms[uniform_id];

        } else {  // untested
          t = uniform_id.split(".");
          p = t[0];
          v = t[1];

          if (this[p] === undef) {
            this[p] = {};
          }
          
          this[p][v] = this.uniforms[uniform_id];
          
        }
      } else if ( uniform_id.indexOf("[") !== -1){  // untested
        t = uniform_id.split("[");
        p = t[0];
        t = t[1].split("]");
        k = t[0];
        
        if (this[p] === undef) {
          this[p] = [];
        }
        
        this[p][k] = this.uniforms[uniform_id];
      }
      else {
        this[uniform_id] = this.uniforms[uniform_id];
      }
    },

    addMatrix: function(uniform_id, default_val) {
      this.use();
      this.uniforms[uniform_id] = GLCore.gl.getUniformLocation(this.shader, uniform_id);
      this.uniform_type[uniform_id] = enums.shader.uniform.MATRIX;
      this.uniform_typelist.push([this.uniforms[uniform_id], this.uniform_type[uniform_id]]);

      if (default_val !== undef) {
        this.setMatrix(uniform_id, default_val);
      }

      this.bindSelf(uniform_id);
      return this.uniforms[uniform_id];
    },

    addVector: function(uniform_id, default_val) {
      this.use();

      this.uniforms[uniform_id] = GLCore.gl.getUniformLocation(this.shader, uniform_id);
      this.uniform_type[uniform_id] = enums.shader.uniform.VECTOR;
      this.uniform_typelist.push([this.uniforms[uniform_id], this.uniform_type[uniform_id]]);

      if (default_val !== undef) {
        this.setVector(uniform_id, default_val);
      }

      this.bindSelf(uniform_id);
      return this.uniforms[uniform_id];
    },

    addFloat: function(uniform_id, default_val) {
      this.use();
      this.uniforms[uniform_id] = GLCore.gl.getUniformLocation(this.shader, uniform_id);
      this.uniform_type[uniform_id] = enums.shader.uniform.FLOAT;
      this.uniform_typelist.push([this.uniforms[uniform_id], this.uniform_type[uniform_id]]);

      if (default_val !== undef) {
        this.setFloat(uniform_id, default_val);
      }

      this.bindSelf(uniform_id);
      return this.uniforms[uniform_id];
    },

    addVertexArray: function(uniform_id) {
      this.use();
      this.uniforms[uniform_id] = GLCore.gl.getAttribLocation(this.shader, uniform_id);
      this.uniform_type[uniform_id] = enums.shader.uniform.ARRAY_VERTEX;
      this.uniform_typelist.push([this.uniforms[uniform_id], this.uniform_type[uniform_id]]);

      this.bindSelf(uniform_id);
      return this.uniforms[uniform_id];
    },

    addUVArray: function(uniform_id) {
      this.use();
      this.uniforms[uniform_id] = GLCore.gl.getAttribLocation(this.shader, uniform_id);
      this.uniform_type[uniform_id] = enums.shader.uniform.ARRAY_UV;
      this.uniform_typelist.push([this.uniforms[uniform_id], this.uniform_type[uniform_id]]);

      this.bindSelf(uniform_id);
      return this.uniforms[uniform_id];
    },

    addFloatArray: function(uniform_id) {
      this.use();
      this.uniforms[uniform_id] = GLCore.gl.getAttribLocation(this.shader, uniform_id);
      this.uniform_type[uniform_id] = enums.shader.uniform.ARRAY_FLOAT;
      this.uniform_typelist.push([this.uniforms[uniform_id], this.uniform_type[uniform_id]]);

      this.bindSelf(uniform_id);
      return this.uniforms[uniform_id];
    },

    addInt: function(uniform_id, default_val) {
      this.use();
      this.uniforms[uniform_id] = GLCore.gl.getUniformLocation(this.shader, uniform_id);
      this.uniform_type[uniform_id] = enums.shader.uniform.INT;
      this.uniform_typelist.push([this.uniforms[uniform_id], this.uniform_type[uniform_id]]);

      if (default_val !== undef) {
        this.setInt(uniform_id, default_val);
      }

      this.bindSelf(uniform_id);
      return this.uniforms[uniform_id];
    },

    use: function() {
      GLCore.gl.useProgram(this.shader);
    },

    setMatrix: function(uniform_id, mat) {
      var u = this.uniforms[uniform_id];
      if (u === null) {
        return;
      }
      
      var l = mat.length;
      
      if (l===16) {
        GLCore.gl.uniformMatrix4fv(u, false, mat);  
      } else if (l === 9) {
        GLCore.gl.uniformMatrix3fv(u, false, mat);  
      } else if (l === 4) {
        GLCore.gl.uniformMatrix2fv(u, false, mat);  
      }
    },

    setInt: function(uniform_id, val) {
      var u = this.uniforms[uniform_id];
      if (u === null) {
        return;
      }
      
      GLCore.gl.uniform1i(u, val);
    },

    setFloat: function(uniform_id, val) {
      var u = this.uniforms[uniform_id];
      if (u === null) {
        return;
      }
      
      GLCore.gl.uniform1f(u, val);
    },

    setVector: function(uniform_id, val) {
      var u = this.uniforms[uniform_id];
      if (u === null) {
        return;
      }
      
      var l = val.length;
      
      if (l==3) {
        GLCore.gl.uniform3fv(u, val);    
      } else if (l==2) {
        GLCore.gl.uniform2fv(u, val);    
      } else {
        GLCore.gl.uniform4fv(u, val);
      }
    },
    
    clearArray: function(uniform_id) {
      var gl = GLCore.gl;  
      var u = this.uniforms[uniform_id];
      if (u === null) {
        return;
      }
        
      gl.disableVertexAttribArray(u);
    },

    bindArray: function(uniform_id, buf) {
      var gl = GLCore.gl;  
      var u = this.uniforms[uniform_id];
      if (u === null) {
        return;
      }
      
      var t = this.uniform_type[uniform_id];
        
      if (t === enums.shader.uniform.ARRAY_VERTEX) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(u, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(u);
      } else if (t === enums.shader.uniform.ARRAY_UV) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(u, 2, gl.FLOAT, false, 0, 0);
      } else if (t === enums.shader.uniform.ARRAY_FLOAT) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(u, 1, gl.FLOAT, false, 0, 0);
      }
    }
  };
  
  var internal_vars = ["colorMap","envSphereMap","normalMap","bumpMap","reflectMap","specularMap","ambientMap","alphaMap",
  "uMVMatrix","uPMatrix","uOMatrix","uNMatrix","aVertexPosition","aNormal","aColor","aTextureCoord","uTexOffset",
  "amVertexPosition","amNormal","morphWeight","lDiff","lSpec","lInt","lDist","lPos","lDir",
  "lCut","lDepthTex","lProjTex","lDepth","spMatrix","lAmb","mDiff","mColor","mAmb","mSpec","mShine",
  "envAmount","mAlpha","depthInfo"];
  
  
  var shader_util = {
    getShaderInfo: function(v,f) {
        var i,iMax,j,jMax,s;
        var typeList = ["uniform","attribute","varying"];
        var ids = [];      
        var shader_vars = { };
        var shader_structs = { };

        if (f === undef) f = "";
        
        // TODO: optimize cleanup parts to regex
   
        // TODO: cleanup     
        var str = (v+"\n"+f).replace("\t"," "); 
   
        while (str.indexOf("  ") !== -1) {
          str = str.replace("  "," ");
        }
        while (str.indexOf(" [") !== -1) {
          str = str.replace(" [","[");
        }
        
        var ar_str = util.multiSplit(str,"\n;");
        
        var structList = [];
        var start = -1, end = -1;
        
        for (i = 0, iMax = ar_str.length; i<iMax; i++) {
          s = ar_str[i];

          // TODO: cleanup     
          if (start === -1 && s.indexOf("struct")===0) {
            start = i;          
          } else if (end === -1 && start !==-1 && s.indexOf("}")!==-1) {
            end = i+1;
          }
          
          if (start !== -1 && end !== -1) {
            // TODO: cleanup     
            var structStr = ar_str.slice(start,end).join("\n").replace("{","\n").replace("}","\n");
            while (structStr.indexOf("  ") !== -1) { 
              structStr = structStr.replace("  "," ");
            }
            while (structStr.indexOf(" \n") !== -1) {
              structStr = structStr.replace(" \n","\n");
            }
            while (structStr.indexOf("\n\n") !== -1) {
              structStr = structStr.replace("\n\n","\n");
            }
            
            structList.push({start:start,end:end,struct:structStr.split("\n")});
            start = -1;
            end = -1;
          }
        }
        
        for (i = 0, iMax = structList.length; i<iMax; i++) {
          var struct = structList[i].struct;

          var structName = null;
                  
          for (j = 0, jMax = struct.length; j<jMax; j++) {
            var s = struct[j].split(" ");
            if (s.length <= 1) continue;
            
            if (s[0] == "struct") {
              structName = s[1];
              shader_structs[structName] = { };
            } else if (structName) {
              shader_structs[structName][s[1]] = s[0];
            }
          }
          
        }
        shader_vars.struct = shader_structs;

        for (i = 0, iMax = typeList.length; i < iMax; i++) {                        
            shader_vars[typeList[i]] = [];                
        }
        
        for (i = 0, iMax = ar_str.length; i < iMax; i++) {
            s = ar_str[i];
            for (j = 0, jMax = typeList.length; j < jMax; j++) {                        
                var typeName = typeList[j];
                if (s.indexOf(typeName)===0) {
                    var sa = s.split(" ");
                    if (sa.length === 3 && sa[0] == typeName) {
                        if (ids.indexOf(sa[2]) === -1) {
                            ids.push(sa[2]);
                            if (sa[2].indexOf("[")!==-1) {
                              var ar_info = sa[2].split("[");
                              var arLen = ar_info[1].replace("]","");
                              var arLenInt = parseInt(arLen);
                              if (!(arLenInt!==arLenInt)) {
                                arLen = arLenInt;
                              }
                              shader_vars[typeName].push({name:ar_info[0],type:sa[1],isArray:true,len:arLen}); 
                            } else {
                              shader_vars[typeName].push({name:sa[2],type:sa[1]});
                            }
                        }
                    }
                }
            }
        }
        
        return shader_vars;
    },
    genShaderVarList: function(shaderInfo,vtype) {
      var shaderVars = shaderInfo[vtype];
      var resultList = [];
      var i,iMax,j,jMax, svLoc;
      
      if (!shaderVars) return [];
      
      for (var i = 0, iMax = shaderVars.length; i < iMax; i++) {
        var sv = shaderVars[i];
        if (shaderInfo.struct[sv.type]) {
          var structInfo = shaderInfo.struct[sv.type];
          if (sv.isArray) {
            for( j = 0, jMax = sv.len; j<jMax; j++) {
              svLoc = sv.name+"["+j+"]";
              for ( var n in structInfo ) {
                if (!structInfo.hasOwnProperty(n)) {
                  continue;
                }
                resultList.push({location:svLoc+"."+n,type:structInfo[n],basename:sv.name});
              }
            }
          } else {
            for ( var n in structInfo ) {
              resultList.push({location:sv.name+"."+n,type:structInfo[n],basename:sv.name});
            }
          }
        } else {
          if (sv.isArray) {
            for( j = 0, jMax = sv.len; j<jMax; j++) {
              svLoc = sv.name+"["+j+"]";
              resultList.push({location:svLoc,type:sv.type,basename:sv.name});
            }
          } else {
              resultList.push({location:sv.name,type:sv.type,basename:sv.name});
          }
        }
      }
      return resultList;
    },
    getShaderVars: function(shaderInfo) {
        var results = {};
        
        results.uniform = shader_util.genShaderVarList(shaderInfo,"uniform");
        results.attribute = shader_util.genShaderVarList(shaderInfo,"attribute");
        
        return results;
    }
  };
  
  function MaterialShader(obj_init) {
    this._update = obj_init.update||null;
    this._vertex = CubicVR.get(obj_init.vertex)||null;
    this._fragment = CubicVR.get(obj_init.fragment)||null;
    this._bindings = [];
    this._shader = null;
    this._shaderInfo = null;
    this._shaderVars = null;
    this._initialized = false;
  }
  
  MaterialShader.prototype = {
    use: function() {
      if (this._initialized) {
        this._shader.use();
      }      
    },
    getShader: function() {
      return this._shader;      
    },   
    ready: function() {
      return this._initialized;
    },
    _init: function(vs_id,fs_id,doSplice,spliceToken) {
      var vertex_shader = CubicVR.util.get(vs_id);
      var fragment_shader = CubicVR.util.get(fs_id);
      spliceToken = spliceToken||"#define materialShader_splice";
      doSplice = (doSplice===undef)?(this._vertex||this._fragment):doSplice;
      
      if (doSplice) {
        var vertSplice = vertex_shader.indexOf(spliceToken);
        var fragSplice = fragment_shader.indexOf(spliceToken);
        
        if (vertSplice!==-1&&this._vertex) {
          vertex_shader = vertex_shader.substr(0,vertSplice)+this._vertex;
        }
        if (fragSplice!==-1&&this._fragment) {
          fragment_shader = fragment_shader.substr(0,fragSplice)+this._fragment;
        }
      }
      
      this._shader = new CubicVR.Shader(vertex_shader,fragment_shader);
      this._shaderInfo = shader_util.getShaderInfo(vertex_shader,fragment_shader);
      this._shaderVars = shader_util.getShaderVars(this._shaderInfo);
      this._appendShaderVars(this._shaderVars,"uniform");
      this._appendShaderVars(this._shaderVars,"attribute"); 
      this._initialized = true;
    },
    _appendShaderVars: function(varList,utype) {
      for (var i = 0, iMax = this._shaderVars[utype].length; i < iMax; i++) {
        var sv = this._shaderVars[utype][i];
        var svloc = sv.location;
        var basename = sv.basename;
        if (internal_vars.indexOf(basename)!==-1) {
           console.log("MaterialShader: Skipped ~["+basename+"]");
           continue;
        } else {
           console.log("MaterialShader:   Added +["+basename+"]");
        }
        var svtype = sv.type;
        if (svtype === "vec3") {
          if (utype === "attribute") {
            this._shader.addVertexArray(svloc);          
          } else {
            this._shader.addVector(svloc);
          }
        } else if (svtype === "vec2") {
          if (utype === "attribute") {
            this._shader.addUVArray(svloc);          
          } else {
            this._shader.addVector(svloc);
          }
        } else if (svtype === "float") {
          if (utype === "attribute") {
            this._shader.addFloatArray(svloc);          
          } else {
            this._shader.addFloat(svloc);
          }
        } else if (svtype === "sampler2D"||svtype === "int") {
          this._shader.addInt(svloc);
        } else if (svtype === "mat4"||svtype === "mat3"||svtype === "mat2") {
          this._shader.addMatrix(svloc);     
        } 
        this._bindSelf(svloc);
      }
    },
    
    _bindSelf: function(uniform_id) {  
      var t,k,p,v,bindval;
      
      if (this._shader.uniforms[uniform_id]===null) return;
      
      if (uniform_id.indexOf(".")!==-1) {
        if (uniform_id.indexOf("[")!==-1) {
          t = uniform_id.split("[");
          p = t[0];
          t = t[1].split("]");
          k = t[0];
          t = t[1].split(".");
          v = t[1];
          
          if (this[p] === undef) {
            this[p] = [];
          }
          if (this[p][k] === undef) {
            this[p][k] = {};
          }
          
          bindval = { location: this._shader.uniforms[uniform_id], value: null, type: this._shader.uniform_type[uniform_id] };          
          this[p][k][v] = bindval;
          this._bindings.push(bindval);

        } else {  // untested
          t = uniform_id.split(".");
          p = t[0];
          v = t[1];

          if (this[p] === undef) {
            this[p] = {};
          }
          
          bindval = { location: this._shader.uniforms[uniform_id], value: null, type: this._shader.uniform_type[uniform_id] };          
          this[p][v] = bindval;          
          this._bindings.push(bindval);          
        }
      } else if ( uniform_id.indexOf("[") !== -1){  // untested
        t = uniform_id.split("[");
        p = t[0];
        t = t[1].split("]");
        k = t[0];
        
        if (this[p] === undef) {
          this[p] = [];
        }
        
        bindval = { location: this._shader.uniforms[uniform_id], value: null, type: this._shader.uniform_type[uniform_id] };       
        this[p][k] = bindval;
        this._bindings.push(bindval);
      }
      else {
        bindval = { location: this._shader.uniforms[uniform_id], value: null, type: this._shader.uniform_type[uniform_id] };
        this[uniform_id] = bindval;
        this._bindings.push(bindval);
      }
    },
    _doUpdate: function() {
        if (this._update) {
          this._update(this);
        } else {
          for (var i = 0, iMax = this._bindings.length; i<iMax; i++) {
            this.update(this._bindings[i]);            
          }
        }
    },
    update: function(bindObj) {
      if (!this._initialized) return;
      var gl = GLCore.gl;
      var l;
      var val = bindObj.value;
      var u = bindObj.location;

      if (u === null) return;
      
      if (bindObj.type == enums.shader.uniform.MATRIX) {
        l = val.length;
      
        if (l===16) {
          gl.uniformMatrix4fv(u, false, val);  
        } else if (l === 9) {
          gl.uniformMatrix3fv(u, false, val);  
        } else if (l === 4) {
          gl.uniformMatrix2fv(u, false, val);
        }      
      } else if (bindObj.type == enums.shader.uniform.INT) {
         gl.uniform1i(u, val);             
      } else if (bindObj.type == enums.shader.uniform.VECTOR) {
        l = val.length;
      
        if (l==3) {
          gl.uniform3fv(u, val);    
        } else if (l==2) {
          gl.uniform2fv(u, val);    
        } else {
          gl.uniform4fv(u, val);
        }    
      } else if (bindObj.type == enums.shader.uniform.FLOAT) {
        gl.uniform1f(u, val);  
      } else if (bindObj.type == enums.shader.uniform.ARRAY_VERTEX) {
        gl.bindBuffer(gl.ARRAY_BUFFER, val);
        gl.vertexAttribPointer(u, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(u);              
      } else if (bindObj.type == enums.shader.uniform.ARRAY_UV) {
        gl.bindBuffer(gl.ARRAY_BUFFER, val);
        gl.vertexAttribPointer(u, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(u);              
      } else if (bindObj.type == enums.shader.uniform.ARRAY_FLOAT) {
        gl.bindBuffer(gl.ARRAY_BUFFER, val);
        gl.vertexAttribPointer(u, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(u);              
      } 
    }
  };


  var extend = {
    Shader: Shader,
    shader_util: shader_util,
    MaterialShader: MaterialShader,
  };
  
  return extend;
});
