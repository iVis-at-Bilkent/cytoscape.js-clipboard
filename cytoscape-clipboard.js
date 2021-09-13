; (function () {
	'use strict';

	// registers the extension on a cytoscape lib ref
	var register = function (cytoscape, $) {
		if (!cytoscape || !$) {
			return;
		} // can't register if cytoscape unspecified

		cytoscape('core', 'clipboard', function (opts) {
			var cy = this;

			//Global variables to hold x and y coordinates in case of pasting//
			var mouseX, mouseY, hoveringNode, clickedNode;
			var cutedNode = [];
			var cuted = false;
			var pasteCuted = true;
			var a = null;
			var typeIds;
			cy.on('mousemove', function onmousemove(e) {
				var pos = e.position || e.cyPosition;
				mouseX = pos.x;
				mouseY = pos.y;
				if (e.target != cy && e.target.isNode()) {
					hoveringNode = e.target;
				} else {
					hoveringNode = null;
				}
			});

			var options = {
				beforeCopy: null,
				afterCopy: null,
				beforePaste: null,
				afterPaste: null,
				afterCut: null,
				beforeCut: null,
			};

			$.extend(true, options, opts);

			function getScratch() {
				if (!cy.scratch('_clipboard')) {
					cy.scratch('_clipboard', {});
				}
				return cy.scratch('_clipboard');
			}

			// get the scratchpad reserved for this extension on cy
			var scratchPad = getScratch();

			var counter = 0;

			function guid() {
				function s4() {
					return Math.floor((1 + Math.random()) * 0x10000)
						.toString(16)
						.substring(1);
				}

				return (
					s4() +
					s4() +
					'-' +
					s4() +
					'-' +
					s4() +
					'-' +
					s4() +
					'-' +
					s4() +
					s4() +
					s4()
				);
			}

			function getItemId(last) {
				return last ? 'item_' + counter : 'item_' + ++counter;
			}

			function getCloneId() {
				return guid();
			}

			var oldIdToNewId = {};

			function changeIds(jsons, pasteAtMouseLoc, cuted) {
				jsons = $.extend(true, [], jsons);

				for (var i = 0; i < jsons.length; i++) {
					var jsonFirst = jsons[i];

					if (!cuted) {
						var id = getCloneId();
						oldIdToNewId[jsonFirst.data.id] = id;
						jsonFirst.data.id = id;
					} else {
						var id = jsonFirst.data.id;
					}
				}

				//Paste the elements centered at the mouse location
				var topLeftX, topLeftY;
				var bottomRightX, bottomRightY;
				var centerX, centerY;
				var diffX, diffY;
				//Checks only for nodes
				if (jsons[0] !== undefined && jsons[0].position.x) {
					topLeftX = jsons[0].position.x;
					topLeftY = jsons[0].position.y;
					bottomRightX = jsons[0].position.x;
					bottomRightY = jsons[0].position.y;

					for (var k = 1; k < jsons.length; k++) {
						var ele = jsons[k];

						if (ele.position.x < topLeftX) {
							topLeftX = ele.position.x;
						}
						if (ele.position.y < topLeftY) {
							topLeftY = ele.position.y;
						}
						if (ele.position.x > bottomRightX) {
							bottomRightX = ele.position.x;
						}
						if (ele.position.y > bottomRightY) {
							bottomRightY = ele.position.y;
						}
					}
					centerX = (topLeftX + bottomRightX) / 2;
					centerY = (topLeftY + bottomRightY) / 2;

					diffX = mouseX - centerX;
					diffY = mouseY - centerY;
				}

				if (cuted) {
					var visibleNodes = cy.$(':visible');
				}
				var temp = [];
				var count = 0;

				for (var j = 0; j < jsons.length; j++) {
					var json = jsons[j];
					var fields = ['source', 'target', 'parent'];
					for (var k = 0; k < fields.length; k++) {
						var field = fields[k];
						if (json.data[field] && oldIdToNewId[json.data[field]])
							json.data[field] = oldIdToNewId[json.data[field]];
					}

					if (cuted && hoveringNode != null) {
						if (json.data['parent'] == null) {
							json.data['parent'] = hoveringNode.id();
						} else if (
							json.data['parent'] != null &&
							cutedNode.includes(json.data.id)
						) {
							json.data['parent'] = hoveringNode.id();
						}
					} else if (cuted && hoveringNode == null) {
						if (cutedNode.includes(json.data.id)) {
							json.data['parent'] = null;
						}
					}
					if (json.position.x) {
						if (pasteAtMouseLoc == false) {
							json.position.x += 50;
							json.position.y += 50;
						} else {
							json.position.x += diffX;
							json.position.y += diffY;
						}
					}
				}

				return jsons;
			}

			if (!scratchPad.isInitialized) {
				scratchPad.isInitialized = true;
				var ur;
				var clipboard = {};

				scratchPad.instance = {
					copy: function (eles, _id) {
						cy.clipboard().mouseForsync(cy.$(':selected'));

						cuted = false;
						pasteCuted = true;
						var id = _id ? _id : getItemId();
						var descs = eles.nodes().descendants();
						var nodes = eles.nodes().union(descs).filter(':visible');
						var edges = nodes.edgesWith(nodes).filter(':visible');

						if (options.beforeCopy) {
							options.beforeCopy(nodes.union(edges));
						}
						clipboard[id] = { nodes: nodes.jsons(), edges: edges.jsons() };
						if (options.afterCopy) {
							options.afterCopy(clipboard[id]);
						}
						cy.clipboard().mouseForsync(cy.$(':selected'));
						eles.unselect();

						return id;
					},
					paste: function (_id, pasteAtMouseLoc) {
						cy.clipboard().mouseForsync(cy.$(':selected'));
						if (pasteCuted == true) {
							var id = _id ? _id : getItemId(true);
							var res = cy.collection();
							if (options.beforePaste) {
								options.beforePaste(clipboard[id]);
							}

							if (clipboard[id]) {
								var nodes = changeIds(
									clipboard[id].nodes,
									pasteAtMouseLoc,
									cuted,
								);
								var edges = changeIds(
									clipboard[id].edges,
									pasteAtMouseLoc,
									cuted,
								);

								oldIdToNewId = {};
								cy.batch(function () {
									res = cy.add(nodes).union(cy.add(edges));
									res.select();
								});
							}
							if (options.afterPaste) {
								options.afterPaste(res);
							}
							cy.trigger('pasteClonedElements');
							//res.unselect();
							if ((cuted == true) & (pasteCuted == true)) {
								cuted = false;
								pasteCuted = false;
							} else if (pasteCuted == true) {
								cuted = false;
								pasteCuted = true;
							}

							cy.clipboard().mouseForsync(cy.$(':selected'));

							return res;
						} else {
							return null;
						}
					},

					cut: function (eles, _id) {
						cutedNode = [];
						cy.clipboard().mouseForsync(cy.$(':selected'));
						typeIds = cy.elements('node:selected');
						cuted = false;
						pasteCuted = true;
						var id = _id ? _id : getItemId();
						var descs = eles.nodes().descendants();
						var nodes = eles.nodes().union(descs).filter(':visible');
						var edges = nodes.edgesWith(nodes).filter(':visible');

						if (options.beforeCut) {
							options.beforeCut(nodes.union(edges));
						}

						clipboard[id] = { nodes: nodes.jsons(), edges: edges.jsons() };
						eles.remove();
						if (options.afterCut) {
							options.afterCut(clipboard[id]);
						}
						eles.unselect();
						cuted = true;
						pasteCuted = true;
						var i = 0;
						var tempC = [];
						var temP = [];
						var k = 0;
						for (let i = 0; i < typeIds.length; i++) {
							tempC[i] = typeIds[i].id();

							if (typeIds[i].data().parent != null) {
								temP[i] = typeIds[i].data().parent;
								console.log(temP[i]);
							} else {
								k = 1;
								cutedNode.push(typeIds[i].id());
							}
						}

						var i1 = 0;
						var j1 = 0;

						while (j1 < temP.length) {
							if (tempC.includes(temP[j1])) {
								j1 = j1 + 1;
							} else {
								if (cutedNode.includes(typeIds[j1].data().parent) == false)
									console.log('pushed', typeIds[j1].id());
								cutedNode.push(typeIds[j1].id());
								j1 = j1 + 1;
							}
						}

						cy.clipboard().mouseForsync(cy.$(':selected'));
						return nodes.union(edges);
					},
					mouseForsync: function () {
						// This fucntion syncs the mouse over with the changes in the nodes
						cy.nodes().one('mouseover', function onmouseover(e) {
							hoveringNode = e.target;
						});
						cy.nodes().one('mouseout', function onmouseout(e) {
							hoveringNode = null;
						});
					},
				};

				if (cy.undoRedo) {
					cuted = false;
					pasteCuted = true;
					ur = cy.undoRedo({}, true);

					ur.action(
						'paste',
						function (eles) {
							return eles.firstTime
								? scratchPad.instance.paste(
									eles.id,
									eles.pasteAtMouseLoc,
									cuted,
								)
								: eles.restore();
						},
						function (eles) {
							return eles.remove();
						},
					);

					ur.action(
						'cut',
						function (eles) {
							return eles.firstTime
								? scratchPad.instance.cut(cy.$(':selected'))
								: eles.remove();
						},
						function (eles) {
							return eles.restore();
						},
					);
				}
			}

			return scratchPad.instance; // return the extension instance
		});
	};

	if (typeof module !== 'undefined' && module.exports) {
		// expose as a commonjs module
		module.exports = register;
	}

	if (typeof define !== 'undefined' && define.amd) {
		// expose as an amd/requirejs module
		define('cytoscape-clipboard', function () {
			return register;
		});
	}

	if (typeof cytoscape !== 'undefined' && typeof jQuery !== 'undefined') {
		// expose to global cytoscape (i.e. window.cytoscape)
		register(cytoscape, jQuery);
	}
})();
