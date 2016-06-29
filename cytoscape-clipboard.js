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
                shortcuts: {
                    enabled: true,
                    undoable: true
                }
            };

            $.extend(true, options, opts);

            var ur;
            var clipboard = {};
            if (options.shortcuts.enabled) {
                var undoable = options.shortcuts.undoable && (cy.undoRedo ? true : false);
                if (undoable)
                    ur = cy.undoRedo({}, true);

                document.addEventListener("keydown", function (e) {
                    if (e.ctrlKey)
                        if (e.which == 67) // CTRL + C
                            _instance.copy(cy.$(":selected"));
                        else if (e.which == 86) // CTRL + V
                            if (undoable)
                                ur.do("paste");
                            else
                                _instance.paste();
                });
            }

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

            function getCloneId(last) {
                if (!last)
                    lastGuid = guid();
                return lastGuid;
            }


            function changeIds(jsons) {
                jsons = $.extend(true, [], jsons);
                var oldIdToNewId = {};
                for (var i = 0; i < jsons.length; i++) {
                    var jsonFirst = jsons[i];
                    var id = getCloneId();
                    oldIdToNewId[jsonFirst.data.id] = id;
                    jsonFirst.data.id = id;
                }

                for (var j = 0; j < jsons.length; j++) {
                    var json = jsons[j];
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
                    eles = eles.union(eles.descendants().union(eles.descendants().connectedEdges()));
                    clipboard[id] = eles.not(eles.nodes().edgesTo(cy.elements().not(eles))).jsons();
                    return id;
                },
                paste: function (_id) {
                    var id = _id ? _id : getItemId(true);
                    var res = cy.collection();
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
                ur = cy.undoRedo({}, true);
                ur.action("paste", function (eles) {
                    console.log("pasted");
                    return eles.firstTime ? _instance.paste(eles.id) : eles.restore();
                }, function (eles) {
                    console.log("undone");
                    return eles.remove();
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
