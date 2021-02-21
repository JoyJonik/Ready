/*
 Based on the krpano iOS 4.2 gyroscope script
 by Aldo Hoeben / fieldofview.com
 contributions by Sjeiti / ronvalstar.nl

 Port for Pano2VR
 Thomas Rauscher / ggnome.com

 This software can be used free of charge and the source code is available under a Creative Commons Attribution license:
 http://creativecommons.org/licenses/by/3.0/

 Included with Pano2VR >= 5.1beta2

 */

function pano2vrGyro(panoObject,containerId) {

	function GgMatrix3d() {

		var m1,m2;

		this.setIdent=function() {
			this.n11 = 1;
			this.n12 = 0;
			this.n13 = 0;
			this.n21 = 0;
			this.n22 = 1;
			this.n23 = 0;
			this.n31 = 0;
			this.n32 = 0;
			this.n33 = 1;
		}
		this.setIdent();

		this.clone=function(m) {
			this.n11 = m.n11;
			this.n12 = m.n12;
			this.n13 = m.n13;
			this.n21 = m.n21;
			this.n22 = m.n22;
			this.n23 = m.n23;
			this.n31 = m.n31;
			this.n32 = m.n32;
			this.n33 = m.n33;
		}

		this.setRotX=function(a) {
			var c = Math.cos(a * Math.PI / 180.0);
			var s = Math.sin(a * Math.PI / 180.0);
			this.n11 = 1;
			this.n12 = 0;
			this.n13 = 0;
			this.n21 = 0;
			this.n22 = c;
			this.n23 = -s;
			this.n31 = 0;
			this.n32 = s;
			this.n33 = c;
		}

		this.setRotY=function(a) {
			var c = Math.cos(a * Math.PI / 180.0);
			var s = Math.sin(a * Math.PI / 180.0);
			this.n11 = c;
			this.n12 = 0;
			this.n13 = s;
			this.n21 = 0;
			this.n22 = 1;
			this.n23 = 0;
			this.n31 = -s;
			this.n32 = 0;
			this.n33 = c;
		}

		this.setRotZ=function(a) {
			var c = Math.cos(a * Math.PI / 180.0);
			var s = Math.sin(a * Math.PI / 180.0);
			this.n11 = c;
			this.n12 = -s;
			this.n13 = 0;
			this.n21 = s;
			this.n22 = c;
			this.n23 = 0;
			this.n31 = 0;
			this.n32 = 0;
			this.n33 = 1;
		}

		this.rotX=function(a) {
			if (!m1) {
				m1 = new GgMatrix3d();
				m2 = new GgMatrix3d();
			}
			m1.setRotX(a);
			m2.clone(this);
			this.multiply(m1, m2);
		}

		this.rotY=function(a) {
			if (!m1) {
				m1 = new GgMatrix3d();
				m2 = new GgMatrix3d();
			}
			m1.setRotY(a);
			m2.clone(this);
			this.multiply(m1, m2);
		}

		this.rotZ=function(a) {
			if (!m1) {
				m1 = new GgMatrix3d();
				m2 = new GgMatrix3d();
			}
			m1.setRotZ(a);
			m2.clone(this);
			this.multiply(m1, m2);
		}


		this.multiply=function(m1, m2) {
			this.n11 = m1.n11 * m2.n11 + m1.n12 * m2.n21 + m1.n13 * m2.n31;
			this.n12 = m1.n11 * m2.n12 + m1.n12 * m2.n22 + m1.n13 * m2.n32;
			this.n13 = m1.n11 * m2.n13 + m1.n12 * m2.n23 + m1.n13 * m2.n33;

			this.n21 = m1.n21 * m2.n11 + m1.n22 * m2.n21 + m1.n23 * m2.n31;
			this.n22 = m1.n21 * m2.n12 + m1.n22 * m2.n22 + m1.n23 * m2.n32;
			this.n23 = m1.n21 * m2.n13 + m1.n22 * m2.n23 + m1.n23 * m2.n33;

			this.n31 = m1.n31 * m2.n11 + m1.n32 * m2.n21 + m1.n33 * m2.n31;
			this.n32 = m1.n31 * m2.n12 + m1.n32 * m2.n22 + m1.n33 * m2.n32;
			this.n33 = m1.n31 * m2.n13 + m1.n32 * m2.n23 + m1.n33 * m2.n33;
		}
	}

	this.setAdaptiveVOffset=function(arg) {
		if((arg===undefined) || (arg === null) || (arg == "")) {
			isAdaptiveDiffTilt = !isAdaptiveDiffTilt;
		} else {
			isAdaptiveDiffTilt = Boolean(arg);
		}
	}

	this.setTrueNorth=function(arg) {
		var tmpIsEnabled=isEnabled;
		if (tmpIsEnabled) { // attach to the correct event handler
			this.disable();	
		} 
		if(arg==undefined || arg === null || arg == "")
			isTrueNorth = !isTrueNorth;
		else
			isTrueNorth = Boolean(arg);
		if (tmpIsEnabled) { // attach to the correct event handler
			this.enable();	
		} 
	}

	this.setUseRoll=function(arg) {
		if(arg==undefined || arg === null || arg == "")
			useRoll = !useRoll;
		else
			useRoll = Boolean(arg);
	}

	this.setUseMoveTo=function(arg,speed) {
		if(arg==undefined || arg === null || arg == "")
			useMoveTo = !useMoveTo;
		else {
			useMoveTo = Boolean(arg);
			if (speed>0.0) {
				moveToSpeed=speed;
			}
		}
	}

	////////////////////////////////////////////////////////////

	function handleTouchStart(event) {
		isTouching = true;
	}

	function handleTouchEnd(event) {
		isTouching = false;
	}

	var deviceHeading=null;

	var mat=new GgMatrix3d();

	function handleDeviceOrientation(event) {

		if ((!event["alpha"]) || (!event["beta"]) || (!event["gamma"])) return;

		var d = new Date();
		var isTouching=(panoSrcObj.isTouching());
		if (isTouching) {
			lastTouch = d.getTime();
		}
		if ( !isTouching && isEnabled && (d.getTime()-lastTouch)>1000) {

			// process event.alpha, event.beta and event.gamma

			var o=0;
			if (window.orientation) {
				o=1.0*parseInt("" + window.orientation,10);
			}
			mat.setIdent();
			mat.rotY(-event.alpha);
			mat.rotZ(-event.beta);
			mat.rotX(-event.gamma+90);
			mat.rotZ(90+o);

			var tilt,pan,roll;
			// x,z,y
			if (mat.n12<1.0) {
				if (mat.n12 > -1.0) {
					roll = 180.0 / Math.PI * Math.asin(-mat.n12);
					tilt = 180.0 / Math.PI * Math.atan2(mat.n32, mat.n22);
					pan  = 180.0 / Math.PI * Math.atan2(mat.n13, mat.n11);
				} else {
					roll=0;
					tilt=90;
					pan  = -180.0 / Math.PI * Math.atan2(-mat.n31, mat.n33);
				}
			} else {
				roll=0;
				tilt=-90;
				pan  = 180.0 / Math.PI * Math.atan2(-mat.n31, mat.n33);
			}

			if (isTrueNorth) {
				var panoHeading = panoSrcObj.getPanNorth() - panoSrcObj.getPanN();

				if ((event.webkitCompassHeading) && ((!event.webkitCompassAccuracy) || (event.webkitCompassAccuracy>=0))) { // iOS
					deviceHeading = event.webkitCompassHeading;
					if (window.orientation) {
						deviceHeading+=window.orientation;
					}
				} else {
					if (event.absolute === true && event.alpha !== null) { // Android
						deviceHeading = -pan;
					}
				}
				if (deviceHeading!==null) {
					diffPan= - (deviceHeading + panoHeading - pan);
				}
			}


			if (ignoreInit==0) {
				var newPan=(diffPan - pan);
				while ((newPan - panoSrcObj.getPan())>180) newPan-=360.0;
				while ((newPan - panoSrcObj.getPan())<-180.0) newPan+=360.0;
				for(var i=0;i<panoDstObj.length;i++) {
					if (useMoveTo) {
						if (useRoll) {
							panoDstObj[i].moveTo(newPan, -tilt, panoSrcObj.getFov(), moveToSpeed, -roll);
						} else {
							panoDstObj[i].moveTo(newPan, -tilt, panoSrcObj.getFov(), moveToSpeed);
						}
					} else {
						panoDstObj[i].setPan(newPan);
						panoDstObj[i].setTilt(-tilt);
						if (useRoll) {
							panoDstObj[i].setRoll(-roll);
						}
					}
				}
			}
			lastPan = -pan;
			lastTilt = -tilt;
			if (ignoreInit>0) {
				diffPan = panoSrcObj.getPan() - lastPan;
				diffTilt = panoSrcObj.getTilt() - lastTilt;
				ignoreInit--;
			}
			adaptDiffTilt();
		} else {
			diffPan = panoSrcObj.getPan() - lastPan;
			diffTilt = panoSrcObj.getTilt() - lastTilt;
		}
	}

	function adaptDiffTilt() {
		if( diffTilt != 0 && isAdaptiveDiffTilt ) {
			diffTilt *= 0.98;
			if( Math.abs( diffTilt ) < 0.1 ) {
				diffTilt = 0;
			}
		}
	}

	this.enable=function() {
		if (isDeviceEnabled && !isEnabled) {
			if (('ondeviceorientationabsolute' in window) && (isTrueNorth)) {
				window.addEventListener("deviceorientationabsolute", handleDeviceOrientation, true);
			} else if ('ondeviceorientation' in window) {
				window.addEventListener("deviceorientation", handleDeviceOrientation, true);
			}
			container.addEventListener("touchstart", handleTouchStart, true);
			container.addEventListener("touchend", handleTouchEnd, true);
			container.addEventListener("touchcancel", handleTouchEnd, true);
			container.addEventListener("MSPointerDown", handleTouchStart, true);
			container.addEventListener("mousedown", handleTouchStart, true);
			container.addEventListener("mousemove", handleTouchStart, true);
			container.addEventListener("mouseup", handleTouchEnd, true);
			isEnabled = true;
		}
		return isEnabled;
	}

	this.disable=function() {
		if (isDeviceEnabled && isEnabled) {
			if (('ondeviceorientationabsolute' in window) && (isTrueNorth)) {
				window.removeEventListener("deviceorientationabsolute", handleDeviceOrientation);
			} else if ('ondeviceorientation' in window) {
				window.removeEventListener("deviceorientation", handleDeviceOrientation);
			}
			container.removeEventListener("touchstart", handleTouchStart);
			container.removeEventListener("touchend", handleTouchEnd);
			container.removeEventListener("touchcancel", handleTouchEnd);
			container.removeEventListener("MSPointerDown", handleTouchStart);
			container.removeEventListener("mousedown", handleTouchStart);
			container.removeEventListener("mousemove", handleTouchStart);
			container.removeEventListener("mouseup", handleTouchEnd);
			isEnabled = false;
		}
		return isEnabled;
	}

	this.toggle=function() {
		if(isEnabled)
			return this.disable();
		else
			return this.enable();
	}
	
	this.reset=function() {
		diffPan = panoSrcObj.getPan();
		diffTilt = panoSrcObj.getTilt();
		ignoreInit=5;
	}

	///////////////////////////////////////////////////
	var lastPan=0;
	var lastTilt=0;
	var lastTouch=0;
	var ignoreInit=10;
	var isDeviceEnabled = !!window.DeviceOrientationEvent,
			isEnabled = false,
			isAdaptiveDiffTilt = false,
			isTrueNorth = false,
			isEasing = 0.5,
			useRoll = false,
			useMoveTo = true,
			moveToSpeed = 10,
			isTouching = false,
			diffPan = 0, diffTilt = 0,
			hlookat = 0, vlookat = 0;

	var	degRad = Math.PI/180;
	var panoSrcObj;
	var panoDstObj=[];

	if (panoObject instanceof Array) {
		panoSrcObj=panoObject[0];
		panoDstObj=panoObject;
	} else {
		panoSrcObj=panoObject;
		panoDstObj[0]=panoObject;
	}
	// turn on "auto level"
	var container = document.getElementById(containerId);

	diffPan = panoSrcObj.getPan();
	diffTilt = panoSrcObj.getTilt();

	this.enable();

	////////////////////////////////////////////////////////////
}

