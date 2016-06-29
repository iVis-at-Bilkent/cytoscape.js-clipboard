;(function () {
    'use strict';

    // registers the extension on a cytoscape lib ref
    var register = function (cytoscape) {

        if (!cytoscape) {
            return;
        } // can't register if cytoscape unspecified


        cytoscape('core', 'clipboard', function (opts) {
            var cy = this;

            var options = {
                clipboardSize: 0,
                keyboardShortcuts: true
            };

            $.extend(true, options, opts);


            var clipboard = {};
            if (options.keyboardShortcuts)
                document.addEventListener("keydown", function (e) {
                    if (e.ctrlKey)
                        if (e.which == 67) // CTRL + C
                            _instance.copy(cy.$(":selected"));
                        else if (e.which == 86) // CTRL + V
                            _instance.paste();
                });


            var counter = 0;

            function guid() {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }

                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            }

            var lastGuid;

            function getItemId(last) {
                return last ? "item_" + counter : "item_" + ++counter;
            }

            var cloneCounter = 0;

            function getCloneId(last) {
                if (!last)
                    lastGuid = guid();
                return lastGuid;
            }


            function changeIds(jsons) {
                jsons = $.extend(true, [], jsons);
                var oldIdToNewId = {};
                for (var i = 0; i < jsons.length; i++) {
                    var json = jsons[i];
                    var id = getCloneId();
                    oldIdToNewId[json.data.id] = id;
                    json.data.id = id;
                }

                for (var i = 0; i < jsons.length; i++) {
                    var json = jsons[i];
                    console.log(json);
                    var fields = ["source", "target", "parent"];
                    for (var k = 0; k < fields.length; k++) {
                        var field = fields[k];
                        if (json.data[field])
                            json.data[field] = oldIdToNewId[json.data[field]];

                    }
                    if (json.position.x) {
                        json.position.x += 50;
                        json.position.y += 50;
                    }
                }

                return jsons;

            }

            var _instance = {
                copy: function (eles, _id) {
                    var id = _id ? _id : getItemId();
                    eles.unselect();
                    clipboard[id] = eles.not(eles.nodes().edgesTo(cy.elements().not(eles))).jsons();
                    return _instance;
                },
                paste: function (_id) {
                    var id = _id ? _id : getItemId(true);
                    var res = null;
                    if (clipboard[id]) {
                        var newElesJsons = changeIds(clipboard[id]);
                        var nodes = $.grep(newElesJsons, function (ele) {
                            return ele.group == "nodes";
                        });
                        var edges = $.grep(newElesJsons, function (ele) {
                            return ele.group == "edges";
                        });
                        cy.batch(function () {
                            res = cy.add(nodes).union(cy.add(edges));
                            res.select();
                        });

                    }
                    return res;
                }
            };

            if (cy.undoRedo){
                var ur = cy.undoRedo({}, true);
                ur.action("paste", function (eles) {
                    return eles.firstTime ? _instance.paste : eles.restore;
                }, function (eles) {
                    return eles.remove;
                });
            }


            return _instance; // chainability
        });

    };

    if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
        module.exports = register;
    }

    if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
        define('cytoscape-clipboard', function () {
            return register;
        });
    }

    if (typeof cytoscape !== 'undefined') { // expose to global cytoscape (i.e. window.cytoscape)
        register(cytoscape);
    }

})();
