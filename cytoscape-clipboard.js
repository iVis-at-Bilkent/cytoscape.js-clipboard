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

            function getItemId(last) {
                return last ? "item_" + counter : "item_" + ++counter;
            }

            var cloneCounter = 0;
            function getCloneId(incr) {
                if (incr)
                    cloneCounter++;

                return "clone_"+ cloneCounter;
            }


            function changeIds(jsons) {
                if (jsons.length == 0)
                    return [];
                var oldIdToNewId = {};
                for (var i = 0; i < jsons.length; i++){
                    var json = jsons[i];
                    var id = getCloneId(true);
                    oldIdToNewId[json.data.id] = id;
                    json.data.id = id;
                }

                for (var i = 0; i < jsons.length; i++){
                    var json = jsons[i];
                    console.log(json);
                    var fields = ["source", "target", "parent"];
                    for (var k = 0 ; k < fields.length; k++){
                        var field = fields[k];
                        if (json.data[field])
                            json.data[field] = oldIdToNewId[json.data[field]];

                    }
                    if(json.position.x) {
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
                    console.log(eles.jsons());
                    clipboard[id] = eles.jsons();
                    return _instance;
                },
                    paste: function (_id) {
                        var id = _id ? _id : getItemId(true);
                        var newElesJsons = changeIds(clipboard[id]);
                        var nodes = $.grep(newElesJsons, function (ele) {
                           return ele.group == "nodes";
                        });
                        var edges = $.grep(newElesJsons, function (ele) {
                            return ele.group == "edges";
                        });
                        cy.startBatch();
                        var res = cy.add(nodes);
                        cy.endBatch();
                        res.select();
                        return res;
                    }
                };


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
