/**
 * Wijmo Vue interop module.
 */
var wijmo;
(function (wijmo) {
    var vue;
    (function (vue) {
        // get an array with a control's properties and events
        function getProps(ctlClass, extraProps) {
            // start with 'special' members
            var p = ['control', 'initialized'];
            // add properties and events on this class and all ancestors
            for (var proto = ctlClass.prototype; proto != Object.prototype; proto = Object.getPrototypeOf(proto)) {
                var props = Object.getOwnPropertyNames(proto);
                for (var i = 0; i < props.length; i++) {
                    var prop = props[i], pd = Object.getOwnPropertyDescriptor(proto, prop), eventRaiser = prop.match(/^on[A-Z]/);
                    if (pd.set || eventRaiser) {
                        if (eventRaiser) {
                            prop = prop[2].toLowerCase() + prop.substr(3);
                        }
                        if (p.indexOf(prop) < 0 && !prop.match(/disabled|required/)) {
                            p.push(prop);
                        }
                    }
                }
            }
            // add extra properties
            if (extraProps) {
                Array.prototype.push.apply(p, extraProps);
            }
            // done
            return p;
        }
        vue.getProps = getProps;
        // initialize control properties from component, add watchers to keep the control in sync
        function initialize(component, control) {
            // hook up event handlers
            for (var prop in component._props) {
                if (control[prop] instanceof wijmo.Event) {
                    var event = control[prop];
                    // fire component event handler
                    if (wijmo.isFunction(component[prop])) {
                        event.addHandler(component[prop], control);
                    }
                    // update property 'xxx' in response to 'xxxChanged' event
                    var m = prop.match(/(\w+)Changed/);
                    if (m && m.length) {
                        prop = m[1];
                        if (control[prop] != null && component[prop] != null) {
                            event.addHandler(_update.bind({
                                component: component,
                                control: control,
                                prop: prop
                            }));
                        }
                    }
                }
            }
            // initialize properties (after setting up event handlers)
            for (var prop in component._props) {
                if (!(control[prop] instanceof wijmo.Event) && component[prop] != null) {
                    control[prop] = component[prop];
                    component.$watch(prop, _watch.bind({ control: control, prop: prop }));
                }
            }
            // set 'control' pseudo-property so it's accessible to parent component
            if (component.control && component.$parent) {
                component.$parent[component.control] = control;
            }
            // invoke 'initialized' event
            if (wijmo.isFunction(component.initialized)) {
                component.initialized(control);
            }
            // update control property to match component changes
            function _watch(newValue) {
                this.control[this.prop] = newValue;
            }
            function _update() {
                this.component[this.prop] = this.control[this.prop];
            }
        }
        vue.initialize = initialize;
        // copy properties from an object to another
        function copy(dst, src) {
            for (var key in src) {
                if (key in dst && wijmo.isPrimitive(src[key])) {
                    dst[key] = src[key];
                }
            }
        }
        vue.copy = copy;
        // get the name of an object from the constructor
        function getClassName(obj) {
            var m = obj.constructor ? obj.constructor.toString().match(/function\s+(\w+)/) : null;
            return (m && m.length) ? m[1] : null;
        }
        vue.getClassName = getClassName;
        ;
    })(vue = wijmo.vue || (wijmo.vue = {}));
})(wijmo || (wijmo = {}));
